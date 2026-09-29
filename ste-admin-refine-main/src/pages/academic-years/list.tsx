import { EditButton, List, useTable } from "@refinedev/antd";
import type { BaseRecord, CrudFilters } from "@refinedev/core";
import { Input, Space, Table, Tag, Typography } from "antd";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { SearchOutlined } from "@ant-design/icons";
import {
  ACADEMIC_STATUS_OPTIONS,
  academicStatusColor,
  academicStatusJa,
} from "@/common/utils/academicYear";

const { Text, Title } = Typography;

export const AcademicYearList = () => {
  const navigate = useNavigate();

  const { tableProps, setFilters } = useTable({
    resource: "academic-years",
    syncWithLocation: true,
    filters: { permanent: [] },
    meta: {
      endpoint: "academic-years-with-stats",
      populate: {
        school_admin: { fields: ["name"] },
      },
    },
  });

  const [q, setQ] = useState("");

  const applyFilters = useCallback(
    (nextQ: string) => {
      const filters: CrudFilters = [];

      const keyword = nextQ.trim();
      if (keyword) {
        filters.push({
          field: "name",
          operator: "contains",
          value: keyword,
        });
      }

      setFilters(filters, "replace");
    },
    [setFilters],
  );

  const total =
    tableProps.pagination !== false ? tableProps.pagination?.total : undefined;

  return (
    <List
      title={
        <div>
          <Title level={4} style={{ margin: "8px 0" }}>
            年度一覧
          </Title>
          <Text type='secondary'>
            {typeof total === "number" ? `${total} 年度` : ""}
          </Text>
        </div>
      }
      createButtonProps={{ children: "年度準備" }}>
      <Space style={{ marginBottom: 20, gap: 14 }} wrap>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={() => applyFilters(q)}
          prefix={<SearchOutlined style={{ fontSize: 10, marginRight: 8 }} />}
          placeholder='年度名で検索'
          style={{ width: 360 }}
          allowClear
          onClear={() => {
            setQ("");
            applyFilters("");
          }}
        />
      </Space>

      <Table
        {...tableProps}
        rowKey='documentId'
        size='middle'
        tableLayout='fixed'
        pagination={{
          ...tableProps.pagination,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}>
        <Table.Column
          dataIndex='name'
          title={"年度"}
          render={(value: string, record: BaseRecord) => (
            <a
              onClick={() =>
                navigate(
                  `/academic-years/${record.documentId ?? record.id}/classes`,
                )
              }
              style={{ cursor: "pointer" }}>
              {value}
            </a>
          )}
        />

        <Table.Column
          dataIndex='class_count'
          title='クラス数'
          render={(v) => v ?? 0}
        />
        <Table.Column
          dataIndex='student_count'
          title='生徒数'
          render={(v) => v ?? 0}
        />

        <Table.Column
          dataIndex='academic_status'
          title='状態'
          filters={ACADEMIC_STATUS_OPTIONS.map((o) => ({
            text: o.label,
            value: o.value,
          }))}
          render={(value: string) => (
            <Tag color={academicStatusColor(value)}>
              {academicStatusJa(value)}
            </Tag>
          )}
        />

        <Table.Column
          title={"Actions"}
          dataIndex='actions'
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton
                hideText
                size='small'
                recordItemId={record.documentId ?? record.id}
                resource='academic-years'
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};
