import { academicStatusJa } from "@/common/utils/academicYear";
import { validateEmailHalfWidth } from "@/utils/validators";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Create, Edit, useForm } from "@refinedev/antd";
import {
  useList,
  type BaseRecord,
  type HttpError,
} from "@refinedev/core";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";

const { Title, Text } = Typography;

type Gender = "male" | "female" | "other";

type TeacherUpsertFormValues = {
  name: string;
  name_kana: string;
  birthday?: string | null;
  gender: Gender;
  academic_year?: string;
  phone?: string;
  email?: string;
  blocked: boolean;
  classes?: string[];
};

type ClassAcademicYearLite = {
  documentId?: string;
  name?: string;
  academic_status?: string;
};

type ClassLite = {
  id?: number;
  documentId?: string;
  name?: string;
  academic_year?: ClassAcademicYearLite | null;
};

const digitsOnly = (v: string) => v.replace(/[^\d]/g, "");

const formatClassLabel = (c?: ClassLite | null) => {
  const baseName = String(c?.name ?? "").trim() || String(c?.documentId ?? "").trim();
  if (!baseName) return "";

  const ayName = String(c?.academic_year?.name ?? "").trim();
  const ayStatus = String(c?.academic_year?.academic_status ?? "").trim();

  if (!ayName) return baseName;

  const aySuffix = ayStatus ? ` (${academicStatusJa(ayStatus)})` : "";
  return `${baseName} - ${ayName}${aySuffix}`;
};

export const TeacherUpsert = () => {
  const navigate = useNavigate();
  const { teacherId } = useParams<{ teacherId?: string }>();
  const isEdit = Boolean(teacherId);

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
        const pr =
          statusPriority(a.academic_status) - statusPriority(b.academic_status);
        if (pr !== 0) return pr;
        return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ja");
      })
      .map((r) => ({
        label: `${r.name ?? "-"} (${academicStatusJa(String(r.academic_status ?? ""))})`,
        value: String(r.documentId ?? r.id ?? ""),
      }))
      .filter((o) => o.value);
  }, [ayResult.data]);

  const {
    formProps,
    saveButtonProps,
    formLoading,
    form,
    query: teacherQuery,
  } = useForm<BaseRecord, HttpError, TeacherUpsertFormValues>({
    resource: "teachers",
    action: isEdit ? "edit" : "create",
    id: teacherId,
    redirect: false,
    meta: {
      populate: {
        classes: {
          fields: ["id", "documentId", "name"],
          populate: {
            academic_year: {
              fields: ["documentId", "name", "academic_status"],
            },
          },
        },
        users_permissions_user: true,
      },
    },
    queryOptions: { enabled: isEdit },
    onMutationSuccess: () => navigate("/teachers"),
  });

  const selectedAcademicYearDocId = Form.useWatch("academic_year", form);

  const existingClassDocIds = useMemo(() => {
    const teacher = teacherQuery?.data?.data;
    if (!Array.isArray(teacher?.classes)) return [] as string[];
    return teacher.classes
      .map((c) => String(c?.documentId ?? c?.id ?? ""))
      .filter(Boolean);
  }, [teacherQuery?.data?.data]);

  const classAcademicYearDocId = isEdit
    ? undefined
    : selectedAcademicYearDocId;

  const { result: availableClasses, query: classesQuery } = useList<
    ClassLite,
    HttpError
  >({
    resource: "classes",
    meta: {
      endpoint: "classes/available",
      query: {
        ...(classAcademicYearDocId
          ? { academic_year: classAcademicYearDocId }
          : {}),
        ...(isEdit && teacherId ? { teacher: teacherId } : {}),
      },
    },
    pagination: { mode: "off" },
    queryOptions: { enabled: isEdit ? !!teacherId : !!classAcademicYearDocId },
  });

  const classesLoading = classesQuery.isLoading;

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();

    for (const c of availableClasses?.data ?? []) {
      const docId = String(c?.documentId ?? "").trim();
      if (!docId) continue;
      const label = formatClassLabel(c) || docId;
      map.set(docId, label);
    }

    if (isEdit) {
      const teacher = teacherQuery?.data?.data;
      for (const c of Array.isArray(teacher?.classes) ? teacher.classes : []) {
        const docId = String(c?.documentId ?? c?.id ?? "").trim();
        if (!docId || map.has(docId)) continue;
        const label = formatClassLabel(c as ClassLite) || docId;
        map.set(docId, label);
      }
    }

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [availableClasses, isEdit, teacherQuery?.data?.data]);

  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (!isEdit) {
      if (didHydrateRef.current) return;
      didHydrateRef.current = true;
      form.setFieldsValue({
        blocked: false,
        gender: "female",
        academic_year: academicYearOptions[0]?.value,
      });
      return;
    }

    const teacher = teacherQuery?.data?.data;
    if (!teacher) return;

    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    const user = teacher.users_permissions_user;

    form.setFieldsValue({
      name: teacher.name ?? "",
      name_kana: teacher.name_kana ?? "",
      birthday: teacher.birthday ?? null,
      gender: (teacher.gender ?? "female") as Gender,
      phone: user?.phone ?? undefined,
      email: (user?.email ?? teacher.email ?? "") as string,
      blocked: Boolean(user?.blocked ?? teacher.blocked ?? false),
      classes: existingClassDocIds,
    });
  }, [
    isEdit,
    teacherQuery?.data,
    form,
    academicYearOptions,
    existingClassDocIds,
  ]);

  useEffect(() => {
    didHydrateRef.current = false;
  }, [teacherId, isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const current = form.getFieldValue("academic_year");
    if (current || !academicYearOptions.length) return;
    form.setFieldValue("academic_year", academicYearOptions[0].value);
  }, [isEdit, form, academicYearOptions]);

  const Wrapper = isEdit ? Edit : Create;

  return (
    <Wrapper
      breadcrumb={false}
      title=''
      goBack={false}
      isLoading={formLoading}
      wrapperProps={{ className: "page-shell" }}
      contentProps={{ className: "page-card", style: { padding: 24 } }}
      saveButtonProps={{ ...saveButtonProps, children: "保存" }}
      headerButtons={() => (
        <Space className='form-actions'>
          <Button type='primary' {...saveButtonProps}>
            保存
          </Button>
        </Space>
      )}>
      <div className='page-header'>
        <Button
          type='link'
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/teachers")}
          style={{ paddingLeft: 0 }}>
          戻る
        </Button>
        <Space />
      </div>

      <Title level={3} className='page-title'>
        {isEdit ? "先生情報編集" : "先生情報登録"}
      </Title>
      {isEdit && <Text type='secondary'>Update teacher information</Text>}

      <Form<TeacherUpsertFormValues>
        {...formProps}
        key={teacherId ?? "create"}
        form={form}
        layout='vertical'
        style={{ marginTop: 24 }}
        initialValues={
          !isEdit ? { blocked: false, gender: "female" } : undefined
        }>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='先生名'
              name='name'
              rules={[
                { required: true, message: "・先生名を入力してください。" },
                {
                  max: 50,
                  message: "・先生名は50文字以内で入力してください。",
                },
              ]}>
              <Input placeholder='山田 太郎' maxLength={50} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='フリガナ'
              name='name_kana'
              rules={[
                { required: true, message: "・フリガナを入力してください。" },
                {
                  max: 50,
                  message: "・フリガナは50文字以内で入力してください。",
                },
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    const ok = /^[ァ-ヶー\u3000\s]+$/.test(v);
                    if (!ok)
                      throw new Error(
                        "・フリガナは全角カタカナで入力してください。",
                      );
                  },
                },
              ]}>
              <Input placeholder='ヤマダ タロウ' maxLength={50} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='生年月日'
              name='birthday'
              rules={[
                {
                  validator: async (_, v?: string | null) => {
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
                value ? value.format("YYYY-MM-DD") : null
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

          <Col xs={24} md={12}>
            <Form.Item
              label='性別'
              name='gender'
              rules={[{ required: true, message: "性別を選択してください。" }]}>
              <Select
                options={[
                  { label: "男性", value: "male" },
                  { label: "女性", value: "female" },
                  { label: "その他", value: "other" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='電話番号'
              name='phone'
              rules={[
                {
                  validator: async (_, v?: string) => {
                    if (!v) return;
                    if (!/^\d+$/.test(v))
                      throw new Error(
                        "・電話番号は半角数字で入力してください。",
                      );
                    if (v.length < 10 || v.length > 11)
                      throw new Error("・電話番号が不正です");
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
              name='email'
              rules={[{ validator: validateEmailHalfWidth }]}>
              <Input
                placeholder='example@mail.com（未入力可）'
                inputMode='email'
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='ステータス'
              name='blocked'
              rules={[{ required: true, message: "必須項目です" }]}>
              <Radio.Group
                optionType='button'
                buttonStyle='solid'
                options={[
                  { label: "有効", value: false },
                  { label: "無効", value: true },
                ]}
              />
            </Form.Item>
          </Col>

          {!isEdit ? (
            <Col xs={24} md={12}>
              <Form.Item
                label='クラス年度'
                name='academic_year'
                rules={[
                  {
                    required: true,
                    message:
                      "・クラス年度（アクティブ/準備中）を選択してください。",
                  },
                ]}>
                <Select
                  placeholder='年度を選択'
                  options={academicYearOptions}
                  showSearch
                  optionFilterProp='label'
                  onChange={() => form.setFieldValue("classes", [])}
                />
              </Form.Item>
            </Col>
          ) : null}

          <Col xs={24} md={12}>
            <Form.Item label='担当クラス（複数選択可）' name='classes'>
              <Select
                mode='multiple'
                placeholder='クラスを選択'
                options={classOptions}
                loading={classesLoading}
                disabled={!isEdit && !classAcademicYearDocId}
                showSearch
                optionFilterProp='label'
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Wrapper>
  );
};
