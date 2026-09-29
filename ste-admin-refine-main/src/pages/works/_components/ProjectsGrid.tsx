import { ProjectRecord } from "@/common/types";
import { fmtDate } from "@/common/utils";
import { Card, Col, Empty, Row, Spin, Typography } from "antd";

const { Text } = Typography;

export const ProjectsGrid = ({
  mode = "student",
  selectedStudentDocId,
  projects,
  onClickProject,
  loading = false,
}: {
  mode?: "student" | "classDay";
  selectedStudentDocId?: string;
  projects: ProjectRecord[];
  onClickProject: (p: ProjectRecord) => void;
  loading?: boolean;
}) => {
  if (mode === "student" && !selectedStudentDocId) {
    return (
      <Empty
        description='左側から生徒フォルダを選択してください'
        style={{ marginTop: 60 }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ marginTop: 60, display: "flex", justifyContent: "center" }}>
        <Spin tip='読み込み中...' />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Empty
        description={
          mode === "classDay" ? "この日の作品がありません" : "作品がありません"
        }
        style={{ marginTop: 60 }}
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {projects.map((p) => {
        const coverUrl = p.thumbnail?.url;

        return (
          <Col key={p.documentId ?? String(p.id)} lg={12} xl={8} xxl={6}>
            <Card
              hoverable
              style={{ borderRadius: 12, overflow: "hidden" }}
              cover={
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    background: "rgba(0,0,0,0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt='thumb'
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div style={{ color: "rgba(0,0,0,0.35)" }}>
                      No Thumbnail
                    </div>
                  )}
                </div>
              }
              onClick={() => onClickProject(p)}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Text strong>{p.title ?? "-"}</Text>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {fmtDate(p.createdAt)}
                </Text>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};
