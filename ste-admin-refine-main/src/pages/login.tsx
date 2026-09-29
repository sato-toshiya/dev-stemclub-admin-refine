import { useLogin } from "@refinedev/core";
import { Button, Card, Col, Form, Input, Layout, Row, Typography, notification } from "antd";
import { getErrorMessage } from "@/common/helpers/error";

type LoginFormValues = {
    email: string;
    password: string;
};

export const LoginPage = () => {
    const { mutate: login, isPending } = useLogin<LoginFormValues>();
    const [api, contextHolder] = notification.useNotification();

    const onFinish = (values: LoginFormValues) => {
        login(
            {
                email: values.email,
                password: values.password,
            },
            {
                onError: (error) => {
                    const errorMessage = getErrorMessage(error, "ログインに失敗しました。メールアドレスとパスワードを確認してください。");
                    api.error({
                        message: "ログインエラー",
                        description: errorMessage === 'Invalid identifier or password' ? '無効な識別子またはパスワード' : errorMessage,
                        placement: "topRight",
                    });
                },
            },
        );
    };

    return (
        <>
            {contextHolder}
            <Layout>
                <Row align="middle" justify="center" style={{
                    padding: '16px 0px',
                    minHeight: '100dvh'
                }} >
                    <Col xs={22}>
                        <Card
                            style={{
                                maxWidth: '400px',
                                margin: 'auto',
                                padding: '32px',
                                boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 4px, rgba(0, 0, 0, 0.02) 0px 1px 6px -1px, rgba(0, 0, 0, 0.03) 0px 1px 2px',
                                backgroundColor: 'rgb(255, 255, 255)'
                            }}
                            styles={{
                                body: {
                                    padding: '0px',
                                    marginTop: '32px'
                                },
                                header: {
                                    borderBottom: '0px',
                                    padding: '0px'
                                }
                            }}
                            title={<Typography.Title level={3} style={{
                                color: "#756eff",
                                textAlign: "center",
                                marginBottom: "0px",
                                fontSize: "24px",
                                lineHeight: "32px",
                                fontWeight: "700",
                                overflowWrap: "break-word",
                                hyphens: "manual"
                            }} >ログイン</Typography.Title>}>

                            <Form<LoginFormValues>
                                layout='vertical'
                                initialValues={{
                                    email: "",
                                    password: "",
                                }}
                                onFinish={onFinish}>
                                <Form.Item
                                    label='メール'
                                    name='email'
                                    rules={[
                                        { required: true, message: "メールアドレスを入力してください。" },
                                        { type: "email", message: "有効なメールアドレスを入力してください。" },
                                    ]}>
                                    <Input placeholder='メールアドレスを入力してください。' />
                                </Form.Item>
                                <Form.Item
                                    label='パスワード'
                                    name='password'
                                    rules={[{ required: true, message: "パスワードを入力してください。" }]}>
                                    <Input.Password placeholder="●●●●●●●●" />
                                </Form.Item>
                                <Button
                                    type='primary'
                                    htmlType='submit'
                                    block
                                    loading={isPending}>
                                    ログイン
                                </Button>
                            </Form>
                        </Card >
                    </Col>
                </Row>
            </Layout >
        </>
    );
};


