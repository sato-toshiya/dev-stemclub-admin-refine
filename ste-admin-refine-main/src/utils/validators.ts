export const validateEmailHalfWidth = async (_: unknown, value?: string) => {
  const v = (value ?? "").trim();
  if (!v) return;

  if (/[\uFF01-\uFF5E]/.test(v) || /[\u3000]/.test(v)) {
    throw new Error("全角文字は使用できません。半角で入力してください");
  }

  const re =
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

  if (!re.test(v)) {
    throw new Error("メールアドレスの形式が正しくありません。");
  }
};
