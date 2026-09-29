import { validateEmailHalfWidth } from "@/utils/validators";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Create, Edit, useForm } from "@refinedev/antd";
import { BaseRecord, HttpError, useOne } from "@refinedev/core";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Radio,
  Row,
  Space,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";

const { Title } = Typography;

type SchoolAdminUpsertFormValues = {
  name: string;
  name_kana?: string;
  representor: string;
  establishment_date?: string;
  postal_code: string;
  email: string;
  address: string;
  admin_password?: string;
  phone: string;
  blocked?: boolean;
  notes?: string;
};

const normalizeDigits = (v: string) => v.replace(/[^\d]/g, "");

export const SchoolAdminUpsert = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { formProps, saveButtonProps, formLoading, form } = useForm<
    BaseRecord,
    HttpError,
    SchoolAdminUpsertFormValues
  >({
    resource: "school-admins",
    action: isEdit ? "edit" : "create",
    id,
    redirect: "list",
  });

  const { query } = useOne({
    resource: "school-admins",
    id: id || "",
    queryOptions: { enabled: isEdit && !!id },
  });

  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (!isEdit) {
      if (didHydrateRef.current) return;
      didHydrateRef.current = true;
      form.setFieldsValue({ blocked: false });
      return;
    }

    const data = query.data?.data;
    if (!data) return;
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    const schoolAdmin = data?.schoolAdmin ?? data;
    const user = data?.user;

    form.setFieldsValue({
      name: schoolAdmin?.name ?? "",
      name_kana: schoolAdmin?.name_kana ?? "",
      representor: schoolAdmin?.representor ?? "",
      establishment_date: schoolAdmin?.establishment_date ?? undefined,
      postal_code: schoolAdmin?.postal_code ?? "",
      address: schoolAdmin?.address ?? "",
      notes: schoolAdmin?.notes ?? "",
      email: user?.email ?? schoolAdmin?.email ?? "",
      phone: user?.phone ?? schoolAdmin?.phone ?? "",
      blocked: user?.blocked ?? schoolAdmin?.blocked ?? false,
    });
  }, [isEdit, query.data, form]);

  useEffect(() => {
    didHydrateRef.current = false;
  }, [id, isEdit]);

  const handleFinish = async (values: SchoolAdminUpsertFormValues) => {
    if (!isEdit) {
      const phoneDigits = normalizeDigits(values.phone || "");
      const defaultPassword = phoneDigits.slice(-6);

      return formProps.onFinish?.({
        ...values,
        admin_password: values.admin_password?.trim()
          ? values.admin_password.trim()
          : defaultPassword,
        blocked: values.blocked ?? false,
        phone: normalizeDigits(values.phone || ""),
        postal_code: normalizeDigits(values.postal_code || ""),
      });
    }

    const payload: SchoolAdminUpsertFormValues = {
      ...values,
      phone: normalizeDigits(values.phone || ""),
      postal_code: normalizeDigits(values.postal_code || ""),
    };

    if (!payload.admin_password?.trim()) {
      delete payload.admin_password;
    } else {
      payload.admin_password = payload.admin_password.trim();
    }

    return formProps.onFinish?.(payload);
  };

  const Wrapper = isEdit ? Edit : Create;

  return (
    <Wrapper
      breadcrumb={false}
      title=''
      goBack={false}
      wrapperProps={{ className: "page-shell" }}
      contentProps={{ className: "page-card", style: { padding: 24 } }}
      saveButtonProps={{ ...saveButtonProps, children: "保存" }}
      isLoading={formLoading}
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
          onClick={() => navigate("/school-admins")}
          style={{ paddingLeft: 0 }}>
          戻る
        </Button>
        <Space />
      </div>

      <Title level={3} className='page-title'>
        {isEdit ? "法人情報編集" : "新規法人登録"}
      </Title>

      <Form<SchoolAdminUpsertFormValues>
        {...formProps}
        key={id ?? "create"}
        form={form}
        layout='vertical'
        style={{ marginTop: 24 }}
        onFinish={handleFinish}
        initialValues={!isEdit ? { blocked: false } : undefined}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label='法人名'
              name='name'
              rules={[{ required: true, message: "必須項目です" }]}>
              <Input placeholder='法人名' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label='法人名（フリガナ）' name='name_kana'>
              <Input placeholder='法人名（フリガナ）' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='代表者名（理事長）'
              name='representor'
              rules={[{ required: true, message: "必須項目です" }]}>
              <Input placeholder='代表者名（理事長）' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='設立年月日'
              name='establishment_date'
              getValueProps={(value) => (value ? { value: dayjs(value) } : {})}
              getValueFromEvent={(value) =>
                value ? value.toISOString() : value
              }>
              <DatePicker style={{ width: "100%" }} inputReadOnly />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='郵便番号'
              name='postal_code'
              rules={[
                { required: true, message: "必須項目です" },
                {
                  validator: async (_, value: string) => {
                    const digits = normalizeDigits(value || "");
                    if (!digits) return;
                    if (digits.length !== 7) {
                      throw new Error("郵便番号は7桁で入力してください");
                    }
                  },
                },
              ]}>
              <Input
                placeholder='郵便番号'
                inputMode='numeric'
                onChange={(e) =>
                  form.setFieldsValue({
                    postal_code: normalizeDigits(e.target.value),
                  })
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='所在地（住所）'
              name='address'
              rules={[{ required: true, message: "必須項目です" }]}>
              <Input.TextArea
                rows={2}
                placeholder='所在地（住所）'
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='メールアドレス'
              name='email'
              rules={[
                { required: true, message: "必須項目です" },
                { validator: validateEmailHalfWidth },
              ]}>
              <Input placeholder='メールアドレス' inputMode='email' />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='パスワード'
              name='admin_password'
              rules={[
                {
                  validator: async (_, value: string) => {
                    if (!value?.trim()) return;
                    if (value.trim().length < 6) {
                      throw new Error(
                        "パスワードは6文字以上で入力してください",
                      );
                    }
                  },
                },
              ]}
              extra={
                isEdit
                  ? "（未入力の場合、既存のパスワードを維持）"
                  : "（default: 電話下6桁）"
              }>
              <Input.Password
                placeholder={
                  isEdit
                    ? "パスワード（未入力の場合、既存のパスワードを維持）"
                    : "パスワード"
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label='電話番号'
              name='phone'
              rules={[
                { required: true, message: "必須項目です" },
                {
                  validator: async (_, value?: string) => {
                    const digits = normalizeDigits(value || "");
                    if (!digits) return;
                    if (digits.length < 10)
                      throw new Error("電話番号が短すぎます");
                  },
                },
              ]}>
              <Input
                placeholder='電話番号'
                inputMode='numeric'
                pattern='[0-9]*'
                maxLength={15}
                onChange={(e) => {
                  const digits = normalizeDigits(e.target.value);
                  form.setFieldsValue({ phone: digits });
                }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label={"Active"} name='blocked' initialValue={false}>
              <Radio.Group
                optionType='button'
                buttonStyle='solid'
                options={[
                  { label: "FALSE", value: true },
                  { label: "TRUE", value: false },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label={"その他"} name='notes'>
              <Input.TextArea
                rows={4}
                placeholder='その他'
                style={{ resize: "none" }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Wrapper>
  );
};
