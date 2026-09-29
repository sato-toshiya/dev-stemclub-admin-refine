import type {
  BaseRecord,
  CreateManyParams,
  CreateParams,
  CustomParams,
  DeleteManyParams,
  DeleteOneParams,
  GetListParams,
  GetManyParams,
  GetOneParams,
  HttpError,
  DataProvider as IDataProvider,
  UpdateManyParams,
  UpdateParams,
} from "@refinedev/core";
import {
  axiosInstance as defaultAxiosInstance,
  generateFilter,
  generateSort,
  transformHttpError,
} from "@refinedev/strapi-v4";
import type { AxiosInstance } from "axios";

type StrapiEntity = {
  id?: string | number;
  documentId?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
};

const flatten = (data: StrapiEntity | StrapiEntity[] | null): unknown => {
  if (!data || Array.isArray(data)) return data;
  if (!data.attributes) return data;

  const { attributes, id, documentId, ...rest } = data;

  // Use Strapi v5 documentId as primary identifier in refine
  const primaryId = documentId ?? id;

  return {
    id: primaryId,
    documentId: primaryId,
    legacyId: id,
    ...rest,
    ...attributes,
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

const appendPopulateValue = (
  searchParams: URLSearchParams,
  path: string,
  value: unknown,
) => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendPopulateValue(searchParams, `${path}[${index}]`, item);
    });
    return;
  }

  if (isObject(value)) {
    Object.entries(value).forEach(([key, nestedValue]) => {
      appendPopulateValue(searchParams, `${path}[${key}]`, nestedValue);
    });
    return;
  }

  searchParams.append(path, String(value));
};

const normalizeDataV5 = (raw: unknown): unknown => {
  if (Array.isArray(raw)) {
    return raw.map((item) => normalizeDataV5(item));
  }

  if (isObject(raw)) {
    let data: unknown = raw;

    if (Array.isArray((raw as { data?: unknown }).data)) {
      data = [...(raw as { data: unknown[] }).data];
    } else if (isObject((raw as { data?: unknown }).data)) {
      data = flatten({
        ...(raw as { data: StrapiEntity }).data,
      } as StrapiEntity);
    } else if ((raw as { data?: unknown }).data === null) {
      data = null;
    } else {
      data = flatten(raw as StrapiEntity);
    }

    if (isObject(data)) {
      const obj: Record<string, unknown> = { ...data };
      for (const key of Object.keys(obj)) {
        obj[key] = normalizeDataV5(obj[key]);
      }
      return obj;
    }

    return data;
  }

  return raw;
};

const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (key === "populate" && isObject(value)) {
      const populateObj = value as Record<string, unknown>;
      Object.entries(populateObj).forEach(([popKey, popValue]) => {
        appendPopulateValue(searchParams, `populate[${popKey}]`, popValue);
      });
    } else if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          searchParams.append(key, String(v));
        }
      });
    } else if (isObject(value)) {
      // For other objects, stringify them
      searchParams.append(key, JSON.stringify(value));
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};

export const StrapiV5DataProvider = (
  apiUrl: string,
  httpClient: AxiosInstance = defaultAxiosInstance,
): Required<IDataProvider> => ({
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: GetListParams,
  ) => {
    const { resource, pagination, filters, sorters, meta } = params;
    const endpoint = meta?.endpoint as string | undefined;
    const url = `${apiUrl}/${endpoint ?? resource}`;

    const {
      currentPage = 1,
      pageSize = 10,
      mode = "server",
    } = pagination ?? {};

    const locale = meta?.locale;
    const fields = meta?.fields;
    const populate = meta?.populate;
    const publicationState = meta?.publicationState;
    const extraQuery = meta?.query as Record<string, unknown> | undefined;

    const querySorters = generateSort(sorters);
    const queryFilters = generateFilter(filters);

    const query = {
      ...(mode === "server"
        ? {
            "pagination[page]": currentPage,
            "pagination[pageSize]": pageSize,
          }
        : {}),
      locale,
      publicationState,
      fields,
      populate,
      ...(extraQuery ?? {}),
      sort: querySorters.length > 0 ? querySorters.join(",") : undefined,
    };

    const queryString = buildQueryString(query);

    const { data } = await httpClient.get(
      `${url}?${queryString}&${queryFilters}`,
    );

    const normalized = normalizeDataV5(data);

    return {
      data: normalized as TData[],
      // support pagination when meta is not present by falling back to client-side length
      total:
        data.meta?.pagination?.total ||
        (Array.isArray(normalized) ? normalized.length : 0),
    };
  },

  getMany: async <TData extends BaseRecord = BaseRecord>(
    params: GetManyParams,
  ) => {
    const { resource, ids, meta } = params;
    const url = `${apiUrl}/${resource}`;

    const locale = meta?.locale;
    const fields = meta?.fields;
    const populate = meta?.populate;
    const publicationState = meta?.publicationState;

    const queryFilters = generateFilter([
      {
        field: "id",
        operator: "in",
        value: ids,
      },
    ]);

    const query = {
      locale,
      fields,
      populate,
      publicationState,
      "pagination[pageSize]": ids.length,
    };

    const queryString = buildQueryString(query);

    const { data } = await httpClient.get(
      `${url}?${queryString}&${queryFilters}`,
    );

    return {
      data: normalizeDataV5(data) as TData[],
    };
  },

  create: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: CreateParams<TVariables>,
  ) => {
    const { resource, variables } = params;
    const url = `${apiUrl}/${resource}`;

    let dataVariables: unknown = { data: variables };

    if (resource === "users") {
      dataVariables = variables;
    }

    try {
      const { data } = await httpClient.post(url, dataVariables);
      return { data: normalizeDataV5(data) as TData };
    } catch (error) {
      throw transformHttpError(error);
    }
  },

  update: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: UpdateParams<TVariables>,
  ) => {
    const { resource, id, variables } = params;
    const url = `${apiUrl}/${resource}/${id}`;

    let dataVariables: unknown = { data: variables };

    if (resource === "users") {
      dataVariables = variables;
    }

    try {
      const { data } = await httpClient.put(url, dataVariables);
      return { data: normalizeDataV5(data) as TData };
    } catch (error) {
      throw transformHttpError(error);
    }
  },

  updateMany: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: UpdateManyParams<TVariables>,
  ) => {
    const { resource, ids, variables } = params;
    const errors: HttpError[] = [];

    const response = await Promise.all(
      ids.map(async (id) => {
        const url = `${apiUrl}/${resource}/${id}`;
        let dataVariables: unknown = { data: variables };

        if (resource === "users") {
          dataVariables = variables;
        }

        try {
          const { data } = await httpClient.put(url, dataVariables);
          return normalizeDataV5(data);
        } catch (error) {
          errors.push(transformHttpError(error));
          return null;
        }
      }),
    );

    if (errors.length > 0) throw errors;

    return { data: response.filter(Boolean) as TData[] };
  },

  createMany: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: CreateManyParams<TVariables>,
  ) => {
    const { resource, variables } = params;
    const errors: HttpError[] = [];

    const response = await Promise.all(
      variables.map(async (param) => {
        try {
          const { data } = await httpClient.post(`${apiUrl}/${resource}`, {
            data: param,
          });
          return normalizeDataV5(data);
        } catch (error) {
          errors.push(transformHttpError(error));
          return null;
        }
      }),
    );

    if (errors.length > 0) throw errors;

    return { data: response.filter(Boolean) as TData[] };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: GetOneParams,
  ) => {
    const { resource, id, meta } = params;

    const queryString = buildQueryString({
      locale: meta?.locale,
      fields: meta?.fields,
      populate: meta?.populate,
      publicationState: meta?.publicationState,
    });

    const url = `${apiUrl}/${resource}/${id}${queryString ? `?${queryString}` : ""}`;

    const { data } = await httpClient.get(url);

    return {
      data: normalizeDataV5(data) as TData,
    };
  },

  deleteOne: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: DeleteOneParams<TVariables>,
  ) => {
    const { resource, id } = params;
    const url = `${apiUrl}/${resource}/${id}`;

    const { data } = await httpClient.delete(url);

    return {
      data: normalizeDataV5(data) as TData,
    };
  },

  deleteMany: async <
    TData extends BaseRecord = BaseRecord,
    TVariables = Record<string, unknown>,
  >(
    params: DeleteManyParams<TVariables>,
  ) => {
    const { resource, ids } = params;
    const response = await Promise.all(
      ids.map(async (id: string | number) => {
        const { data } = await httpClient.delete(`${apiUrl}/${resource}/${id}`);
        return normalizeDataV5(data);
      }),
    );
    return { data: response as TData[] };
  },

  getApiUrl: () => {
    return apiUrl;
  },

  custom: async <
    TData extends BaseRecord = BaseRecord,
    TQuery = unknown,
    TPayload = unknown,
  >(
    params: CustomParams<TQuery, TPayload>,
  ) => {
    const { url, method, filters, sorters, payload, query, headers } = params;

    let requestUrl = `${url}?`;

    if (sorters) {
      const sortQuery = generateSort(sorters);
      if (sortQuery.length > 0) {
        const sortQueryString = buildQueryString({
          sort: sortQuery.join(","),
        });
        requestUrl = `${requestUrl}&${sortQueryString}`;
      }
    }

    if (filters) {
      const filterQuery = generateFilter(filters);
      requestUrl = `${requestUrl}&${filterQuery}`;
    }

    if (query && isObject(query)) {
      const queryString = buildQueryString(query as Record<string, unknown>);
      requestUrl = `${requestUrl}&${queryString}`;
    }

    try {
      let axiosResponse;

      switch (method) {
        case "put":
          axiosResponse = await httpClient.put(url, payload, { headers });
          break;
        case "post":
          axiosResponse = await httpClient.post(url, payload, { headers });
          break;
        case "patch":
          axiosResponse = await httpClient.patch(url, payload, { headers });
          break;
        case "delete":
          axiosResponse = await httpClient.delete(url, {
            data: payload,
            headers,
          });
          break;
        default:
          axiosResponse = await httpClient.get(requestUrl, { headers });
          break;
      }
      const { data } = axiosResponse;
      return { data: normalizeDataV5(data) as TData };
    } catch (error) {
      throw transformHttpError(error);
    }
  },
});
