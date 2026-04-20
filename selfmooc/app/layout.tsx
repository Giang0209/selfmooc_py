import type { Metadata } from "next";
// 1. Import phông Nunito từ kho của Google
import { Nunito } from "next/font/google";

// Declare CSS module for TypeScript
// Đảm bảo bạn đã tạo file này với Tailwind directives
import "./global.css";
// 2. Cấu hình phông chữ (Bắt buộc phải có "vietnamese" để không bị lỗi dấu)
const nunito = Nunito({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"], // Lấy đủ các nét từ mỏng đến siêu đậm
  display: "swap", // Giúp load phông mượt hơn, không bị giật màn hình
});

export const metadata: Metadata = {
  title: "SelfMOOC - Vô Học Thôi!",
  description: "Nền tảng học tập vui nhộn dành cho học sinh tiểu học",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* 3. Gắn phông chữ mới vào thẻ body */}
      <body className={`${nunito.className} antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}