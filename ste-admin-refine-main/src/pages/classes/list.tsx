import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { DeleteButton, List, useTable } from "@refinedev/antd";
import { useOne, type BaseRecord } from "@refinedev/core";
import { Button, Space, Table, Typography } from "antd";
import { useNavigate, useParams } from "react-router";

const { Title } = Typography;

type AcademicYear = {
  id?: string;
  documentId?: string;
  legacyId?: number;
  name?: string;
};

export const ClassList = () => {
  const { academicYearId } = useParams<{ academicYearId: string }>();
  const id = academicYearId ?? "";
  const navigate = useNavigate();

  const { query } = useOne({
    resource: "academic-years",
    id: id || "",
  });

  const academicYear = query.data?.data as AcademicYear | undefined;

  const { tableProps } = useTable({
    resource: "classes",
    filters: {
      permanent: [
        {
          field: "academic_year.documentId",
          operator: "eq",
          value: id,
        },
      ],
    },
    syncWithLocation: true,
    meta: {
      populate: {
        teacher: true,
      },
    },
  });

  return (
    <List
      title={
        <div>
          <Button
            type='link'
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/academic-years")}
            style={{ paddingLeft: 0 }}>
            年度一覧に戻る
          </Button>
          <Title level={4} style={{ margin: "8px 0" }}>
            {academicYear?.name || "Academic Year"} - クラス一覧
          </Title>
        </div>
      }
      headerButtons={() => (
        <Button
          type='primary'
          onClick={() => navigate(`/academic-years/${id}/classes/create`)}>
          + クラス追加
        </Button>
      )}>
      <Table {...tableProps} rowKey='documentId'>
        <Table.Column
          dataIndex='name'
          title='クラス名'
          render={(value, record: BaseRecord) => (
            <Button
              type='link'
              style={{ padding: 0 }}
              onClick={() =>
                navigate(
                  `/students?class=${encodeURIComponent(String(record.documentId))}`,
                )
              }>
              {value}
            </Button>
          )}
        />

        <Table.Column
          dataIndex={["teacher", "name"]}
          title='先生'
          render={(_, record: BaseRecord) => record?.teacher?.name ?? "-"}
        />

        <Table.Column
          dataIndex='studentsCount'
          title='生徒数'
          render={(value: number | undefined) =>
            typeof value === "number" ? `${value}名` : "-"
          }
        />

        <Table.Column
          dataIndex='assignmentSubmissionsCount'
          title='作品数'
          render={(value: number | undefined) =>
            typeof value === "number" ? `${value}個` : "0"
          }
        />

        <Table.Column
          title={"Actions"}
          dataIndex='actions'
          render={(_, record: BaseRecord) => (
            <Space>
              <Button
                size='small'
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(
                    `/academic-years/${id}/classes/${record.documentId ?? record.id}/edit`,
                  )
                }
              />
              <DeleteButton
                hideText
                size='small'
                recordItemId={record.documentId ?? record.id}
                resource='classes'
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
