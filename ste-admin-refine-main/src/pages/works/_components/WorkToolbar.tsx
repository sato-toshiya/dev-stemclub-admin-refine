import React from "react";
import { Button, DatePicker, Dropdown, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type { MenuProps } from "antd";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export const WorkToolbar: React.FC<{
  selectedType: "year" | "class" | "student" | "day" | null;
  breadcrumb: string;

  onBackFolder: () => void;

  classMonth: Dayjs;
  setClassMonth: (d: Dayjs) => void;

  range: [Dayjs | null, Dayjs | null];
  onRangeChange: (v: [Dayjs | null, Dayjs | null] | null) => void;

  sortMenu: MenuProps;
}> = ({
  selectedType,
  breadcrumb,
  onBackFolder,
  classMonth,
  setClassMonth,
  range,
  onRangeChange,
  sortMenu,
}) => {
  const isStudentList = selectedType === "student";
  const isClassDayList = selectedType === "day";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        gap: 12,
      }}>
      <Space size={8}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBackFolder}
          disabled={!selectedType}
        />
        <Text type='secondary' style={{ fontSize: 12 }}>
          {breadcrumb}
        </Text>
      </Space>

      <Space>
        {selectedType === "class" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text type='secondary'>授業日（月）:</Text>
            <DatePicker
              value={classMonth}
              onChange={(d) => d && setClassMonth(d)}
              allowClear={false}
              picker='month'
              format='YYYY-MM'
              inputReadOnly
            />
          </div>
        ) : null}

        {(isStudentList || isClassDayList) && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isStudentList && (
              <>
                <Text type='secondary'>授業日:</Text>
                <RangePicker
                  value={range}
                  onChange={onRangeChange}
                  allowClear
                />
              </>
            )}

            <Dropdown menu={sortMenu} trigger={["click"]}>
              <Button>並べ替え (Sort)</Button>
            </Dropdown>
          </div>
        )}
      </Space>
    </div>
  );
};
