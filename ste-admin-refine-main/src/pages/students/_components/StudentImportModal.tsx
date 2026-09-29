import { UploadOutlined } from "@ant-design/icons";
import { Modal, Upload } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import React from "react";

type Props = {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  targetSummary?: string;
  onOk: () => void;
  onCancel: () => void;
  onChange: (info: UploadChangeParam<UploadFile>) => void;
  onClear: () => void;
};

export const StudentImportModal: React.FC<Props> = ({
  open,
  loading,
  fileList,
  targetSummary,
  onOk,
  onCancel,
  onChange,
  onClear,
}) => {
  return (
    <Modal
      title='生徒CSV/XLSXをインポート'
      open={open}
      centered
      width={560}
      okText='インポート'
      cancelText='キャンセル'
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okButtonProps={{ disabled: fileList.length === 0 }}>
      <div style={{ marginBottom: 8 }}>
        CSV または XLSX を選択してください。
      </div>
      <div
        style={{
          color: "rgba(0,0,0,0.65)",
          marginBottom: 12,
          lineHeight: 1.6,
        }}>
        インポート用ファイルは、1行目に日本語ヘッダー（列名）を入れてください（例:
        氏名、フリガナ、クラス名…）。
        ヘッダー名が一致しない場合、正しく取り込めません。
        <br />
        使用する列名（ヘッダー）の一覧は
        <a href='/students/create' target='_blank' rel='noreferrer'>
          こちら（列名確認ページ）
        </a>
        で確認できます。入力例は
        <a
          href='/templates/student_import_template.xlsx'
          target='_blank'
          rel='noreferrer'>
          サンプルファイル
        </a>
        を参照してください。
      </div>
      <div
        style={{
          marginBottom: 12,
          padding: "8px 10px",
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          borderRadius: 6,
          color: "rgba(0,0,0,0.75)",
          fontSize: 13,
        }}>
        {targetSummary ?? "取り込み先: 未指定（クラス未所属で登録）"}
      </div>

      <Upload.Dragger
        accept='.csv,.xlsx,.xls'
        multiple={false}
        maxCount={1}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={onChange}
        onRemove={() => {
          onClear();
          return true;
        }}
        style={{ padding: 16 }}>
        <p className='ant-upload-drag-icon'>
          <UploadOutlined />
        </p>
        <p className='ant-upload-text'>
          クリックまたはドラッグしてファイルを選択
        </p>
        <p className='ant-upload-hint'>.csv / .xlsx</p>
      </Upload.Dragger>
    </Modal>
  );
};
