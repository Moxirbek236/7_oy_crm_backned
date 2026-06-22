export function transformPhone({ value }: { value: any }): any {
  if (typeof value === "string") {
    const clean = value.replace(/\s+/g, "");
    return clean.startsWith("+") ? clean : "+" + clean;
  }
  return value;
}
