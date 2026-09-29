import { ArrowLeftOutlined } from "@ant-design/icons";
import { Create, Edit, useForm } from "@refinedev/antd";
import { useList, useOne, type BaseRecord } from "@refinedev/core";
import { Button, Col, Form, Input, Row, Select, Space, Typography } from "antd";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

const { Title, Text } = Typography;

type ClassFormValues = {
  name: string;
  class_status?: "active" | "disabled";
  academic_year?: string;
  teacher?: string;
};

export const ClassUpsert = () => {
  const { academicYearId, classId } = useParams<{
    academicYearId: string;
    classId?: string;
  }>();
  const id = academicYearId ?? "";
  const navigate = useNavigate();

  const isEdit = Boolean(classId);

  const { query: classQuery } = useOne({
    resource: "classes",
    id: classId || "",
    meta: { populate: { teacher: true } },
    queryOptions: { enabled: isEdit },
  });

  const { result: teachersResult } = useList({
    resource: "teachers",
    pagination: { mode: "off" },
    meta: { fields: ["name", "documentId"] },
  });

  const { formProps, saveButtonProps, formLoading, form } =
    useForm<ClassFormValues>({
      resource: "classes",
      action: isEdit ? "edit" : "create",
      id: classId,
      redirect: false,
      onMutationSuccess: () => navigate(`/academic-years/${id}/classes`),
    });

  useEffect(() => {
    if (id) form.setFieldsValue({ academic_year: id });
  }, [id, form]);

  useEffect(() => {
    if (!isEdit) return;

    const classData = classQuery.data?.data;
    const teacher = classData?.teacher;

    if (teacher && typeof teacher === "object") {
      const teacherDocId = teacher.documentId ?? teacher.id;
      if (teacherDocId) form.setFieldsValue({ teacher: String(teacherDocId) });
    } else if (typeof teacher === "string") {
      form.setFieldsValue({ teacher });
    }
  }, [isEdit, classQuery.data, form]);

  const Wrapper = isEdit ? Edit : Create;

  return (
    <Wrapper
      breadcrumb={false}
      title={null}
      goBack={false}
      isLoading={formLoading}
      wrapperProps={{ className: "page-shell" }}
      contentProps={{ className: "page-card", style: { padding: 24 } }}
      saveButtonProps={saveButtonProps}
      headerButtons={() => (
        <Space className='form-actions'>
          <Button type='primary' {...saveButtonProps}>
            Save
          </Button>
        </Space>
      )}>
      <div className='page-header'>
        <Button
          type='link'
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/academic-years/${id}/classes`)}
          style={{ paddingLeft: 0 }}>
          戻る
        </Button>
        <Space />
      </div>

      <Title level={3} className='page-title'>
        {isEdit ? "Edit Class" : "クラス追加"}
      </Title>
      {isEdit && (
        <Text className='page-subtitle'>Update class information</Text>
      )}

      <Form
        {...formProps}
        layout='vertical'
        style={{ marginTop: 24 }}
        onFinish={(values) =>
          formProps.onFinish?.({ ...values, academic_year: id })
        }>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={isEdit ? "Class Name" : "クラス名"}
              name={["name"]}
              required
              rules={[
                {
                  required: true,
                  message: isEdit ? "Please enter class name" : "必須項目です",
                },
              ]}>
              <Input placeholder={isEdit ? "e.g. Class 1A" : "クラス名"} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label='教師' name={["teacher"]}>
              <Select
                allowClear
                placeholder='教師を選択'
                showSearch
                optionFilterProp='children'
                filterOption={(input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={teachersResult?.data?.map((t: BaseRecord) => ({
                  label: t.name,
                  value: String(t.documentId ?? t.id),
                }))}
                onChange={(v) => {
                  form.setFieldsValue({ teacher: v ? String(v) : null });
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name={["academic_year"]} hidden initialValue={id}>
          <Input />
        </Form.Item>
      </Form>
    </Wrapper>
  );
};
