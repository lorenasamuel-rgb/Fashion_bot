import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleekFlow — upload products",
  description:
    "A supplier finishes a wholesale lot in conversation. The same confirmed record is what the buyer reads.",
};

const contract =
  "THESIS: The wholesale lot is finished inside Fleek’s product-registration sheet, and the sheet only shows what the supplier actually said. OWN-WORLD: Apple registration sheet — white canvas, SF system type, 12px continuous fields, hairline borders — carrying Fleek yellow #F8C040, selection green #178A56, and black pills. STORY: The supplier message fills title, audience, category, brand, sizes, price, and defects; grade, shipping, and duties stay unknown until stated; confirmation publishes that same record. FIRST VIEWPORT: A phone sheet titled Upload products, progress in Fleek yellow, Add product details, and a yellow Next page beside a Messages thread that drives the fields. FORM: Apple Human Interface product-registration sheet, user-pinned, seed key pinned-apple-fleek. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-canvas text-ink">
        <span hidden dangerouslySetInnerHTML={{ __html: `<!-- ${contract} -->` }} />
        {children}
      </body>
    </html>
  );
}
