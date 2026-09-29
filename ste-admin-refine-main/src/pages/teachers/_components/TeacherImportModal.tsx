import { Modal, Upload } from "antd";
import type { UploadChangeParam } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadOutlined } from "@ant-design/icons";
import React from "react";

type Props = {
  open: boolean;
  loading: boolean;
  fileList: UploadFile[];
  onOk: () => void;
  onCancel: () => void;
  onChange: (info: UploadChangeParam<UploadFile>) => void;
  onClear: () => void;
};

export const TeacherImportModal: React.FC<Props> = ({
  open,
  loading,
  fileList,
  onOk,
  onCancel,
  onChange,
  onClear,
}) => {
  return (
    <Modal
      title='教師CSV/XLSXをインポート'
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
          color: "rgba(0,0,0,0.45)",
          marginBottom: 12,
          lineHeight: 1.6,
        }}>
        インポート用CSVは、1行目に日本語ヘッダー（列名）を入れ、2行目以降にデータを入力してください。
        ヘッダー名が一致しない場合、正しく取り込めません。
        <br />
        必須項目：フリガナ（フリガナ / カナ名 / 氏名（カナ） のいずれか）
        <br />
        クラス名（クラス名 / 担当クラス）は複数指定できます（例：A組, B組 または
        A組、B組）。
        <br />
        使用する列名（ヘッダー）の例は
        <a href='/teachers/create' target='_blank' rel='noreferrer'>
          こちら（列名確認ページ）
        </a>
        で確認できます。入力例は
        <a
          href='/templates/teacher_import_template.xlsx'
          target='_blank'
          rel='noreferrer'>
          サンプルファイル
        </a>
        を参照してください。
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
