import { Layout, Card, Typography, Space, Alert } from "antd";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function HelpPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <Space direction='vertical' size={16} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}>
              <Title level={2} style={{ margin: 0 }}>
                Help
              </Title>
            </div>

            <Text type='secondary'>Need support? Contact us anytime.</Text>

            <Alert
              type='info'
              showIcon
              message='If you need help or have any questions about the app, please contact us.'
            />

            <Card style={{ borderRadius: 12 }}>
              <Typography>
                <Paragraph style={{ marginBottom: 8 }}>
                  Email:{" "}
                  <a href='mailto:anh.nguyen@pionero.io'>
                    anh.nguyen@pionero.io
                  </a>
                </Paragraph>
              </Typography>
            </Card>

            <Text type='secondary'>© {new Date().getFullYear()} • Help</Text>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
