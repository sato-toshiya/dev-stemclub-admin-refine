import { getErrorMessage } from "@/common/helpers/error";
import { academicStatusJa } from "@/common/utils/academicYear";
import { axiosInstance } from "@/provider/authProvider";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Create, Edit, useForm } from "@refinedev/antd";
import {
  useList,
  useNotification,
  useOne,
  type BaseRecord,
  type HttpError,
} from "@refinedev/core";
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

const { Title, Text } = Typography;

type Gender = "male" | "female" | "other";
type GuardianRelationship =
  | "father"
  | "mother"
  | "grandfather"
  | "grandmother"
  | "other";

type StudentUpsertFormValues = {
  name: string;
  name_kana: string;
  birthday: string;
  gender: Gender;
  academic_year?: string;
  code?: string;
  class?: string;

  guardian_name: string;
  guardian_relationship?: GuardianRelationship;
  guardian_phone?: string;

  guardian_email?: string;
  address?: string;
  emergency_phone?: string;

  enrollment_date?: string | null;
  notes?: string;
};

const digitsOnly = (v: string) => v.replace(/[^\d]/g, "");

type ClassOption = {
  documentId: string;
  name: string;
  teacher?: { name?: string; documentId?: string } | null;
};

export const StudentUpsert = () => {
  const navigate = useNavigate();
  const { open } = useNotification();

  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const location = useLocation();
  const classFromQuery = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const c = sp.get("class");
    return c?.trim() || undefined;
  }, [location.search]);
  const fromQuery = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("from")?.trim() || undefined;
  }, [location.search]);

  const { result: ayResult } = useList<BaseRecord, HttpError>({
    resource: "academic-years",
    filters: [
      {
        field: "academic_status",
        operator: "in",
        value: ["active", "pending"],
      },
    ],
    pagination: { mode: "off" },
    meta: { fields: ["name", "documentId", "academic_status"] },
  });

  const academicYearOptions = useMemo(() => {
    const rows = (ayResult.data ?? []) as BaseRecord[];
    const statusPriority = (status: unknown) =>
      status === "active" ? 0 : status === "pending" ? 1 : 99;

    return rows
      .slice()
      .sort((a, b) => {
        const pr = statusPriority(a.academic_status) - statusPriority(b.academic_status);
        if (pr !== 0) return pr;
        return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ja");
      })
      .map((r) => ({
        label: `${r.name ?? "-"} (${academicStatusJa(String(r.academic_status ?? ""))})`,
        value: String(r.documentId ?? r.id ?? ""),
      }))
      .filter((o) => o.value);
  }, [ayResult.data]);

  const activeAyDocId = useMemo(
    () =>
      String(
        ((ayResult.data ?? []) as BaseRecord[]).find(
          (x) => x.academic_status === "active",
        )?.documentId ?? "",
      ) || undefined,
    [ayResult.data],
  );

  const { query: classFromQueryRecord } = useOne<BaseRecord, HttpError>({
    resource: "classes",
    id: classFromQuery ?? "",
    meta: {
      populate: {
        academic_year: {
          fields: ["documentId", "academic_status"],
        },
      },
    },
    queryOptions: {
      enabled: !isEdit && !!classFromQuery,
    },
  });

  const classFromQueryAcademicYearDocId = useMemo(() => {
    const raw = classFromQueryRecord.data?.data?.academic_year?.documentId;
    return typeof raw === "string" && raw.trim() ? raw : undefined;
  }, [classFromQueryRecord.data?.data]);

  const {
    formProps,
    saveButtonProps,
    formLoading,
    form,
    query: studentQuery,
  } = useForm<BaseRecord, HttpError, StudentUpsertFormValues>({
    resource: "students",
    action: isEdit ? "edit" : "create",
    id: id,
    redirect: false,
    meta: {
      populate: {
        class: {
          populate: {
            teacher: true,
            academic_year: { fields: ["documentId", "academic_status"] },
          },
        },
      },
    },
    queryOptions: { enabled: isEdit },
    onMutationSuccess: () => {
      if (!isEdit && fromQuery === "class" && classFromQuery) {
        navigate(`/students?class=${encodeURIComponent(classFromQuery)}`);
        return;
      }
      navigate("/students");
    },
  });

  const selectedAcademicYearDocId = Form.useWatch("academic_year", form);

  const editAcademicYearDocId = useMemo(() => {
    const raw = studentQuery?.data?.data?.class?.academic_year?.documentId;
    return typeof raw === "string" && raw.trim() ? raw : undefined;
  }, [studentQuery?.data?.data]);

  const classAcademicYearDocId = isEdit
    ? (selectedAcademicYearDocId ?? editAcademicYearDocId)
    : selectedAcademicYearDocId;

  const { result: classesResult, query: classesQuery } = useList<
    ClassOption,
    HttpError
  >({
    resource: "classes",
    meta: {
      endpoint: "classes/by-academic-year",
      query: { academic_year: classAcademicYearDocId },
    },
    pagination: { mode: "off" },
    queryOptions: { enabled: !!classAcademicYearDocId },
  });

  const classesLoading = classesQuery.isLoading;

  const classes = useMemo(() => {
    const map = new Map<string, ClassOption>();

    for (const c of classesResult?.data ?? []) {
      if (!c?.documentId) continue;
      map.set(c.documentId, c);
    }

    if (isEdit) {
      const currentClass = studentQuery?.data?.data?.class;
      const docId = String(currentClass?.documentId ?? "").trim();
      if (docId && !map.has(docId)) {
        map.set(docId, {
          documentId: docId,
          name: String(currentClass?.name ?? "").trim() || docId,
          teacher: currentClass?.teacher ?? null,
        });
      }
    }

    return Array.from(map.values());
  }, [classesResult, isEdit, studentQuery?.data?.data]);

  const classOptions = useMemo(
    () =>
      classes.map((c) => ({
        label: c.name,
        value: c.documentId,
      })),
    [classes],
  );

  const classTeacherNameByDocId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of classes) {
      const tName = c.teacher?.name?.trim();
      if (c.documentId) map.set(c.documentId, tName || "");
    }
    return map;
  }, [classes]);

  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (!isEdit) {
      if (didHydrateRef.current) return;
      didHydrateRef.current = true;

      form.setFieldsValue({
        gender: "female",
        guardian_relationship: "mother",
        academic_year:
          classFromQueryAcademicYearDocId ?? academicYearOptions[0]?.value,
        ...(classFromQuery ? { class: classFromQuery } : {}),
      } as Partial<StudentUpsertFormValues>);

      return;
    }

    const stu = studentQuery?.data?.data;
    if (!stu) return;

    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    form.setFieldsValue({
      name: stu.name ?? "",
      name_kana: stu.name_kana ?? "",
      birthday: stu.birthday ?? "",
      gender: (stu.gender ?? "female") as Gender,
      academic_year: stu.class?.academic_year?.documentId ?? undefined,
      code: stu.code ?? "",
      class: stu.class?.documentId ?? undefined,

      guardian_name: stu.guardian_name ?? "",
      guardian_relationship: (stu.guardian_relationship ?? undefined) as
        | GuardianRelationship
        | undefined,
      guardian_phone: stu.guardian_phone ?? "",
      guardian_email: stu.guardian_email ?? "",
      address: stu.address ?? "",
      emergency_phone: stu.emergency_phone ?? "",
      enrollment_date: stu.enrollment_date ?? null,
      notes: stu.notes ?? "",
    });
  }, [
    isEdit,
    studentQuery?.data,
    form,
    classFromQuery,
    classFromQueryAcademicYearDocId,
    academicYearOptions,
    activeAyDocId,
  ]);

  useEffect(() => {
    didHydrateRef.current = false;
  }, [id, isEdit]);

  const selectedClassDocId = Form.useWatch("class", form);
  const teacherName = selectedClassDocId
    ? (classTeacherNameByDocId.get(selectedClassDocId) ?? "")
    : "";

  useEffect(() => {
    if (isEdit) return;
    const current = form.getFieldValue("academic_year");
    if (current || !academicYearOptions.length) return;
    form.setFieldValue("academic_year", academicYearOptions[0].value);
  }, [isEdit, form, academicYearOptions]);

  useEffect(() => {
    if (isEdit) return;
    if (!selectedClassDocId) return;
    const exists = classOptions.some((o) => o.value === selectedClassDocId);
    if (!exists) form.setFieldValue("class", undefined);
  }, [isEdit, selectedClassDocId, classOptions, form]);

  const Wrapper = isEdit ? Edit : Create;

  async function downloadPdfAxios(url: string, filename: string) {
    const res = await axiosInstance.get(url, { responseType: "blob" });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const href = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(href);
  }

  const onExportStudentQrPdf = async () => {
    if (!id) return;

    try {
      const url = `/students/${encodeURIComponent(id)}/export-qr-pdf`;
      const filename = `student_qr_${id}.pdf`;

      await downloadPdfAxios(url, filename);

      open?.({
        type: "success",
        message: "PDFを出力しました",
        description: "QRコードPDFをダウンロードしました。",
      });
    } catch (e: unknown) {
      open?.({
        type: "error",
        message: "PDFの出力に失敗しました",
        description: getErrorMessage(e, "PDFの出力に失敗しました"),
      });
    }
  };

  return (
    <Wrapper
      breadcrumb={false}
      goBack={false}
      isLoading={formLoading}
      title={isEdit ? "生徒情報編集" : "生徒情報登録"}
      saveButtonProps={saveButtonProps}
      headerButtons={() => null}
      headerProps={{
        title: (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Title level={3} style={{ margin: 0 }}>
              {isEdit ? "生徒情報編集" : "生徒情報登録"}
            </Title>
          </div>
        ),
        extra: [
          <Button
            key='save'
            type='primary'
            loading={saveButtonProps.loading}
            disabled={saveButtonProps.disabled}
            onClick={() => form.submit()}>
            保存
          </Button>,
        ],
      }}
      wrapperProps={{ className: "page-shell" }}
      contentProps={{ className: "page-card", style: { padding: 24 } }}>
      <div className='page-header'>
        <Button
          type='link'
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            if (!isEdit && fromQuery === "class" && classFromQuery) {
              navigate(`/students?class=${encodeURIComponent(classFromQuery)}`);
              return;
            }
            navigate("/students");
          }}
          style={{ paddingLeft: 0 }}>
          戻る
        </Button>
        <Space />
      </div>

      <Form<StudentUpsertFormValues>
        {...formProps}
        key={id ?? "create"}
        form={form}
        layout='vertical'
        style={{ marginTop: 24 }}
        onFinishFailed={({ errorFields }) => {
          const first = errorFields?.[0];
          if (!first) return;

          form.scrollToField(first.name, {
            behavior: "smooth",
            block: "center",
          });
          form.focusField?.(first.name);
        }}
        initialValues={
          !isEdit
            ? { gender: "female", guardian_relationship: "mother" }
            : undefined
        }>
        <Title level={4} style={{ marginTop: 0 }}>
          基本情報
        </Title>

        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='氏名'
              name='name'
              rules={[
                { required: true, message: "氏名を入力してください。" },
                { max: 50, message: "氏名は50文字以内で入力してください。" },
              ]}
              required>
              <Input placeholder='山田 花子' maxLength={50} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='フリガナ'
              name='name_kana'
              required
              rules={[
                { required: true, message: "フリガナを入力してください。" },
                {
                  max: 50,
                  message: "フリガナは50文字以内で入力してください。",
                },
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    const ok = /^[ァ-ヶー\u3000\s]+$/.test(v);
                    if (!ok)
                      throw new Error(
                        "フリガナは全角カタカナで入力してください。",
                      );
                  },
                },
              ]}>
              <Input placeholder='ヤマダ ハナコ' maxLength={50} />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label='生年月日'
              name='birthday'
              rules={[
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    const d = dayjs(v, "YYYY-MM-DD", true);
                    if (!d.isValid()) return;
                    if (!d.isBefore(dayjs(), "day")) {
                      throw new Error(
                        "生年月日は過去の日付を選択してください。",
                      );
                    }
                  },
                },
              ]}
              getValueProps={(value) =>
                value ? { value: dayjs(value, "YYYY-MM-DD") } : { value: null }
              }
              getValueFromEvent={(value) =>
                value ? value.format("YYYY-MM-DD") : undefined
              }>
              <DatePicker
                style={{ width: "100%" }}
                format='YYYY-MM-DD'
                disabledDate={(current) =>
                  !!current && current.isAfter(dayjs(), "day")
                }
                inputReadOnly
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label='性別'
              name='gender'
              required
              rules={[
                { required: true, message: "・性別を選択してください。" },
              ]}>
              <Select
                options={[
                  { label: "男性", value: "male" },
                  { label: "女性", value: "female" },
                  { label: "その他", value: "other" },
                ]}
              />
            </Form.Item>
          </Col>

          {isEdit ? (
            <Col xs={24} md={8}>
              <Form.Item
                label='コード'
                name='code'
                extra='保護者がログインしてお子様の課題を確認するために使用します。'
                rules={[
                  {
                    validator: async (_, v?: string) => {
                      if (!v) return;
                      if (!/^\d+$/.test(v))
                        throw new Error("コードは半角数字で入力してください。");
                      if (v.length !== 6)
                        throw new Error("コードは6桁で入力してください。");
                    },
                  },
                ]}
                getValueFromEvent={(e) =>
                  digitsOnly(e?.target?.value ?? "").slice(0, 6)
                }>
                <Input
                  placeholder='6桁の数字'
                  inputMode='numeric'
                  maxLength={6}
                />
              </Form.Item>
            </Col>
          ) : null}

          <Col xs={24} md={8}>
            <Form.Item
              label='クラス年度'
              name='academic_year'
              rules={[
                {
                  required: true,
                  message: "・クラス年度（アクティブ/準備中）を選択してください。",
                },
              ]}>
              <Select
                placeholder='年度を選択'
                options={academicYearOptions}
                showSearch
                optionFilterProp='label'
                onChange={() => form.setFieldValue("class", undefined)}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item
              label='クラス名'
              name='class'
              rules={[
                { required: true, message: "・クラスを選択してください。" },
              ]}>
              <Select
                placeholder='クラスを選択'
                options={classOptions}
                loading={classesLoading}
                showSearch
                optionFilterProp='label'
                allowClear
                disabled={!selectedAcademicYearDocId}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label='先生'>
              <Input
                value={teacherName}
                disabled
                placeholder='クラスを選択してください'
              />
            </Form.Item>
            {!selectedClassDocId ? (
              <Text type='secondary'>クラスを選ぶと先生が自動表示されます</Text>
            ) : null}
          </Col>
        </Row>

        <Title level={4} style={{ marginTop: 24 }}>
          保護者情報
        </Title>

        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='保護者氏名'
              name='guardian_name'
              required
              rules={[
                { required: true, message: "・保護者氏名を入力してください。" },
              ]}>
              <Input placeholder='山田 太郎' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label='続柄' name='guardian_relationship'>
              <Select
                allowClear
                options={[
                  { label: "父", value: "father" },
                  { label: "母", value: "mother" },
                  { label: "祖父", value: "grandfather" },
                  { label: "祖母", value: "grandmother" },
                  { label: "その他", value: "other" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='連絡先電話番号'
              name='guardian_phone'
              rules={[
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    if (!/^\d+$/.test(v))
                      throw new Error("電話番号は半角数字で入力してください。");
                    if (v.length < 10 || v.length > 11)
                      throw new Error("電話番号が不正です");
                  },
                },
              ]}
              getValueFromEvent={(e) => digitsOnly(e?.target?.value ?? "")}>
              <Input placeholder='09012345678' inputMode='numeric' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='メールアドレス'
              name='guardian_email'
              rules={[
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                    if (!ok)
                      throw new Error(
                        "メールアドレスの形式が正しくありません。",
                      );
                  },
                },
              ]}>
              <Input placeholder='kai@doe.com' />
            </Form.Item>
          </Col>

          <Col xs={24} md={24}>
            <Form.Item label='住所' name='address'>
              <Input placeholder='東京都渋谷区代々木1-2-3' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='緊急連絡先'
              name='emergency_phone'
              rules={[
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    if (!/^\d+$/.test(v))
                      throw new Error(
                        "・緊急連絡先は半角数字で入力してください。",
                      );
                    if (v.length < 10 || v.length > 11)
                      throw new Error("・緊急連絡先が不正です");
                  },
                },
              ]}
              getValueFromEvent={(e) => digitsOnly(e?.target?.value ?? "")}>
              <Input placeholder='08087654321' inputMode='numeric' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='入園日'
              name='enrollment_date'
              getValueProps={(value) =>
                value ? { value: dayjs(value, "YYYY-MM-DD") } : { value: null }
              }
              getValueFromEvent={(value) =>
                value ? value.format("YYYY-MM-DD") : undefined
              }>
              <DatePicker
                style={{ width: "100%" }}
                format='YYYY-MM-DD'
                inputReadOnly
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={24}>
            <Form.Item label='備考' name='notes'>
              <Input.TextArea
                rows={3}
                placeholder='アレルギー情報・特記事項など'
              />
            </Form.Item>
          </Col>
        </Row>
        {isEdit ? (
          <>
            <Divider style={{ margin: "28px 0 16px" }} />

            <Title level={4} style={{ marginTop: 0 }}>
              システム関連
            </Title>

            <div style={{ padding: "8px 0 4px" }}>
              <Button type='primary' onClick={onExportStudentQrPdf}>
                QRコード発行
              </Button>
            </div>
          </>
        ) : null}
      </Form>
    </Wrapper>
  );
};
