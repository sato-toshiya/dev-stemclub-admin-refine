import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "ja",
  fallbackLng: "ja",
  interpolation: { escapeValue: false },
  resources: {
    ja: {
      translation: {
        documentTitle: {
          suffix: "",
        },
        warnWhenUnsavedChanges:
          "変更内容が保存されていません。このページを離れますか？",
        notifications: {
          success: "成功",
          error: "エラー",
          createSuccess: "{{resource}}を作成しました",
          editSuccess: "{{resource}}を更新しました",
          deleteSuccess: "{{resource}}を削除しました",
        },

        "academic-years": {
          "academic-years": "年度",
          titles: {
            create: "年度追加",
            edit: "年度編集",
            list: "年度一覧",
            show: "年度詳細",
          },
        },

        classes: {
          titles: {
            create: "クラス追加",
            edit: "クラス編集",
            list: "クラス一覧",
            show: "クラス詳細",
          },
          classes: "クラス",
        },
        teachers: { teachers: "教師" },
        students: { students: "生徒" },
        works: { works: "作品" },
        "school-admins": { "school-admins": "法人管理" },

        buttons: {
          confirm: "確認",
          cancel: "キャンセル",
          edit: "編集",
          delete: "削除",
          save: "保存",
          refresh: "再読み込み",
        },
      },
    },
  },
});

export default i18n;
