import { Layout, Card, Typography, Space, Divider, Alert } from "antd";

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

export default function PrivacyPolicyPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
          }}>
          <Space direction='vertical' size={16} style={{ width: "100%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}>
              <Title level={2} style={{ margin: 0 }}>
                Privacy Policy
              </Title>
            </div>

            <Text type='secondary'>Last updated: 06/02/2026</Text>

            <Alert
              type='info'
              showIcon
              message="We respect your privacy and are committed to protecting children's personal information."
            />

            <Card style={{ borderRadius: 12 }}>
              <Typography>
                <Paragraph>
                  This Privacy Policy explains how our app handles data.
                </Paragraph>

                <Divider />

                <Title level={4}>1. Information We Collect</Title>
                <Paragraph>
                  Our app is designed for children aged 4-5 and does not collect
                  personal information such as names, email addresses, phone
                  numbers, or precise location data.
                </Paragraph>
                <Paragraph>
                  <ul style={{ marginTop: 0 }}>
                    <li>
                      Students sign in using QR codes provided by their teacher.
                    </li>
                    <li>Teachers sign in using a 6-digit PIN code.</li>
                  </ul>
                </Paragraph>
                <Paragraph>
                  These login methods are used only to identify users within the
                  classroom and are not linked to personal identities.
                </Paragraph>

                <Title level={4}>2. How We Use Information</Title>
                <Paragraph>
                  Any information used by the app is solely for:
                </Paragraph>
                <Paragraph>
                  <ul style={{ marginTop: 0 }}>
                    <li>Enabling classroom access</li>
                    <li>Managing learning activities and projects</li>
                    <li>Saving projects created by students and teachers</li>
                  </ul>
                </Paragraph>
                <Paragraph>
                  We do not use data for advertising or marketing purposes.
                </Paragraph>

                <Title level={4}>3. Data Sharing</Title>
                <Paragraph>
                  We do not share, sell, or disclose any data to third parties.
                </Paragraph>

                <Title level={4}>4. Children&apos;s Privacy</Title>
                <Paragraph>
                  This app complies with applicable children&apos;s privacy
                  regulations, including COPPA.
                </Paragraph>
                <Paragraph>
                  <ul style={{ marginTop: 0 }}>
                    <li>No advertising is shown in the app.</li>
                    <li>
                      No external links that require personal information are
                      provided.
                    </li>
                    <li>
                      The app is intended to be used under teacher or parent
                      supervision.
                    </li>
                  </ul>
                </Paragraph>

                <Title level={4}>5. Data Security</Title>
                <Paragraph>
                  We take reasonable measures to protect data used within the
                  app and ensure secure access through QR codes and PIN-based
                  authentication.
                </Paragraph>

                <Title level={4}>6. Changes to This Policy</Title>
                <Paragraph>
                  We may update this Privacy Policy from time to time. Any
                  changes will be posted on this page.
                </Paragraph>

                <Title level={4}>7. Contact Us</Title>
                <Paragraph>
                  If you have any questions or concerns about this Privacy
                  Policy, please contact us:
                </Paragraph>
                <Paragraph>
                  Email:{" "}
                  <a href='mailto:anh.nguyen@pionero.io'>
                    anh.nguyen@pionero.io
                  </a>
                </Paragraph>
              </Typography>
            </Card>

            <Text type='secondary'>
              © {new Date().getFullYear()} • Privacy Policy
            </Text>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}
