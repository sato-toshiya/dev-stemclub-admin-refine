import { ACADEMIC_STATUS_OPTIONS } from "@/common/utils/academicYear";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Create, Edit, useForm } from "@refinedev/antd";
import {
  useList,
  useOne,
  useUpdate,
  type BaseRecord,
  type HttpError,
} from "@refinedev/core";
import {
  App,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router";

const { Title, Text } = Typography;

type AcademicYearFormValues = {
  name: string;
  academic_status?: "active" | "pending" | "archived";
  start_date?: string;
  end_date?: string;
};

export const AcademicYearUpsert = () => {
  const navigate = useNavigate();
  const { modal } = App.useApp();
  const { academicYearId } = useParams<{ academicYearId?: string }>();
  const isEdit = Boolean(academicYearId);
  const { mutateAsync: updateAcademicYear } = useUpdate();
  const { query: currentAcademicYearQuery } = useOne<BaseRecord, HttpError>({
    resource: "academic-years",
    id: academicYearId || "",
    queryOptions: { enabled: isEdit && !!academicYearId },
  });

  const { result: activeAcademicYearsResult } = useList<BaseRecord>({
    resource: "academic-years",
    pagination: { mode: "off" },
    filters: [{ field: "academic_status", operator: "eq", value: "active" }],
    meta: { fields: ["name", "documentId", "academic_status"] },
  });

  const { formProps, saveButtonProps, formLoading } = useForm<
    BaseRecord,
    HttpError,
    AcademicYearFormValues
  >({
    resource: "academic-years",
    action: isEdit ? "edit" : "create",
    id: academicYearId,
    redirect: "list",
  });

  const Wrapper = useMemo(() => (isEdit ? Edit : Create), [isEdit]);

  const confirmCloseCurrentActive = useCallback(
    (activeYearName: string) =>
      new Promise<boolean>((resolve) => {
        modal.confirm({
          title: "確認",
          content: `「${activeYearName}」が現在アクティブです。「${activeYearName}」を終了しますか？`,
          centered: true,
          okText: "終了する",
          cancelText: "キャンセル",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      }),
    [modal],
  );

  const handleFinish = useCallback(
    async (values: AcademicYearFormValues) => {
      const nextStatus = values.academic_status ?? "pending";
      const currentStatus = String(
        currentAcademicYearQuery.data?.data?.academic_status ??
          formProps.initialValues?.academic_status ??
          "",
      );

      const isPromotePendingToActive =
        isEdit && currentStatus === "pending" && nextStatus === "active";

      if (isPromotePendingToActive) {
        const currentDocId = academicYearId ? String(academicYearId) : "";
        const activeYears = Array.isArray(activeAcademicYearsResult?.data)
          ? activeAcademicYearsResult.data
          : [];

        const currentActive = activeYears.find((year) => {
          const docId = String(year.documentId ?? year.id ?? "");
          return Boolean(docId) && docId !== currentDocId;
        });

        if (currentActive) {
          const activeYearName =
            String(currentActive.name ?? "年度").trim() || "年度";
          const shouldClose = await confirmCloseCurrentActive(activeYearName);
          if (!shouldClose) return;

          await updateAcademicYear({
            resource: "academic-years",
            id: String(currentActive.documentId ?? currentActive.id),
            values: { academic_status: "archived" },
          });
        }
      }

      return formProps.onFinish?.(values);
    },
    [
      academicYearId,
      activeAcademicYearsResult?.data,
      currentAcademicYearQuery.data?.data?.academic_status,
      confirmCloseCurrentActive,
      formProps,
      isEdit,
      updateAcademicYear,
    ],
  );

  return (
    <Wrapper
      breadcrumb={false}
      title=''
      goBack={false}
      isLoading={formLoading}
      wrapperProps={{ className: "page-shell" }}
      contentProps={{ className: "page-card", style: { padding: 24 } }}
      saveButtonProps={{ ...saveButtonProps, children: "保存" }}>
      <div className='page-header'>
        <Button
          type='link'
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/academic-years")}
          style={{ paddingLeft: 0 }}>
          戻る
        </Button>
        <Space />
      </div>

      <Title level={3} className='page-title'>
        年度準備
      </Title>
      <Text className='page-subtitle'>年度情報</Text>

      <Form<AcademicYearFormValues>
        {...formProps}
        layout='vertical'
        onFinish={handleFinish}
        style={{ marginTop: 24 }}
        initialValues={{
          ...(formProps.initialValues ?? {}),
          academic_status:
            formProps.initialValues?.academic_status ?? "pending",
        }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label='年度名'
              name='name'
              rules={[{ required: true, message: "必須項目です" }]}>
              <Input placeholder='2026年度' size='large' maxLength={30} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label='ステータス' name='academic_status'>
              <Select size='large' options={[...ACADEMIC_STATUS_OPTIONS]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Wrapper>
  );
};
