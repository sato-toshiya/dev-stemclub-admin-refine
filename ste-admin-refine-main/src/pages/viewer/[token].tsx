import { getErrorMessage } from "@/common/helpers/error";
import { API_URL, API_URL_WITH_API, VIEWER_ORIGIN } from "@/config/api";
import { Button, Empty, Input, Modal, notification, Spin, Typography } from "antd";
import axios from "axios";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router";

type SharedProjectItem = {
  id?: number;
  documentId: string;
  title?: string;
  sjrUrl?: string | null;
  createdAt?: string;
  thumbnail?: {
    url?: string | null;
  } | null;
};

const DELAY_TIME = 1500;

export const Viewer = () => {
  const { token } = useParams<{ token: string }>();
  const [passcode, setPasscode] = useState("");
  const [sjrUrl, setSjrUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedDayShare, setResolvedDayShare] = useState(false);
  const [sharedProjects, setSharedProjects] = useState<SharedProjectItem[]>([]);
  const [resolvedStudentName, setResolvedStudentName] = useState<string>("");

  const isDayShareToken = useMemo(
    () => typeof token === "string" && token.startsWith("d."),
    [token],
  );
  const [api, contextHolder] = notification.useNotification();

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}/${m}/${day}`;
  };

  const resolveMediaUrl = (url?: string | null) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (event.origin !== VIEWER_ORIGIN) {
        return;
      }

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.type === "REDIRECT_EDIT") {
          setTimeout(() => {
            setIsLoading(false);
          }, DELAY_TIME);
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };
    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, []);

  useEffect(() => {
    if (!sjrUrl) return;

    const handler = async (event: MessageEvent) => {
      if (event.origin !== VIEWER_ORIGIN) {
        return;
      }

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data.type === "DOWNLOAD_PROJECT") {
          const url = data.url;

          try {
            const response = await fetch(url);
            const blob = await response.blob();

            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                const base64String = result.split(",")[1] || result;
                resolve(base64String);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });

            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                  type: "PROJECT_DOWNLOADED",
                  data: base64,
                }),
                VIEWER_ORIGIN,
              );
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                  type: "PROJECT_DOWNLOAD_ERROR",
                  error: errorMessage,
                }),
                VIEWER_ORIGIN,
              );
            }
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
    };
  }, [sjrUrl]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSjrUrl(null);
    setIsLoading(false);
  };

  const handleOpenSharedProject = (project: SharedProjectItem) => {
    if (!project.sjrUrl) {
      api.error({
        message: "An error has occurred",
        description: "作品ファイルが見つかりませんでした。",
      });
      return;
    }

    setSjrUrl(project.sjrUrl);
    setIsLoading(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedToken = typeof token === "string" ? token.trim() : "";
    const normalizedPasscode = passcode.trim();

    if (!normalizedToken) {
      api.error({
        message: "An error has occurred",
        description: "共有トークンが見つかりません。",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isDayShareToken) {
        setResolvedDayShare(false);
        setSharedProjects([]);

        const { data } = await axios.post(
          `${API_URL_WITH_API}/projects/share/day/resolve`,
          { token: normalizedToken, passcode: normalizedPasscode },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const studentName = data?.data?.student?.name;
        const projects = Array.isArray(data?.data?.projects)
          ? (data.data.projects as SharedProjectItem[])
          : [];

        setResolvedStudentName(
          typeof studentName === "string" && studentName.trim().length > 0
            ? studentName
            : "",
        );
        setSharedProjects(projects);
        setResolvedDayShare(true);
        return;
      }

      const { data } = await axios.post(
        `${API_URL_WITH_API}/projects/share/resolve`,
        { token: normalizedToken, passcode: normalizedPasscode },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setSjrUrl(data?.data?.sjrUrl ?? null);
      setIsLoading(true);
      setIsModalOpen(true);
    } catch (error) {
      api.error({
        message: "An error has occurred",
        description: getErrorMessage(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}

      <div
        style={{
          margin: "0 auto",
          height: "100dvh",
          display: "flex",
          maxWidth: "720px",
          flexDirection: "column",
          justifyContent: "center",
          padding: "24px",
        }}>
        <Typography.Title level={3} className='page-title'>
          パスコード入力
        </Typography.Title>

        <Typography.Text className='page-subtitle'>
          パスコードを入力してください。
        </Typography.Text>

        <form onSubmit={handleSubmit}>
          <Input
            style={{ marginTop: "24px" }}
            name='passcode'
            maxLength={6}
            onChange={(e) => setPasscode(e.target.value)}
          />

          <Button
            type='primary'
            htmlType='submit'
            style={{ marginTop: "16px", width: "100%" }}
            loading={isSubmitting}
            disabled={!passcode.trim()}>
            送信
          </Button>
        </form>

        {isDayShareToken && resolvedDayShare ? (
          <div style={{ marginTop: "24px" }}>
            <Typography.Title level={4} style={{ marginBottom: "8px" }}>
              {(resolvedStudentName || "生徒") + "の作品"}
            </Typography.Title>

            {sharedProjects.length === 0 ? (
              <Empty
                description='表示できる作品がありません'
                style={{ marginTop: "24px" }}
              />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {sharedProjects.map((project) => (
                  <div
                    key={project.documentId}
                    style={{
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      padding: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}>
                    <div
                      style={{
                        width: 152,
                        flexShrink: 0,
                        aspectRatio: "16 / 9",
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.04)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                      {project.thumbnail?.url ? (
                        <img
                          src={resolveMediaUrl(project.thumbnail.url)}
                          alt='thumbnail'
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <Typography.Text
                          type='secondary'
                          style={{ fontSize: 11, textAlign: "center", padding: 8 }}>
                          No Thumbnail
                        </Typography.Text>
                      )}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}>
                      <Typography.Text strong style={{ minWidth: 0 }} ellipsis>
                        {project.title?.trim() || "Untitled Project"}
                      </Typography.Text>
                      <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                        {formatDate(project.createdAt)}
                      </Typography.Text>
                    </div>

                    <div
                      style={{
                        marginLeft: "auto",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                      }}>
                      <Button
                        type='primary'
                        size='small'
                        onClick={() => handleOpenSharedProject(project)}>
                        開く
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <Modal
        open={isModalOpen}
        onCancel={handleModalClose}
        destroyOnHidden
        footer={null}
        width='100%'
        style={{ top: 0, paddingBottom: 0, margin: 0 }}
        styles={{
          content: {
            height: "100vh",
            width: "100vw",
            margin: 0,
            top: 0,
          },
          body: {
            height: "100%",
          },
        }}>
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255)",
              zIndex: 1000,
            }}>
            <Spin size='large' />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`${VIEWER_ORIGIN}/static/home.html?place=home&filePath=${sjrUrl ? decodeURIComponent(sjrUrl) : ""}&mode=look`}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
          }}
          title='Scratch'
        />
      </Modal>
    </>
  );
};
