# SmartAccommodationFinder (SAF)

Hệ thống tìm kiếm và quản lý phòng trọ thông minh — Đồ án tốt nghiệp.

Nền tảng kết nối người thuê trọ và chủ nhà, tích hợp AI chatbot tư vấn tìm phòng, thanh toán trực tuyến và nhắn tin thời gian thực.

---

## Kiến Trúc Hệ Thống

Polyglot Microservices — nhiều ngôn ngữ/công nghệ chạy song song, giao tiếp qua Nginx API Gateway và RabbitMQ.

```
Client (Web / Mobile)
        │
        ▼
  Nginx API Gateway (port 80)
        │
   ┌────┼────────────────┐
   ▼    ▼                ▼
Spring  Node.js      AI Chat
Boot    Messaging    Service
API     Service      (Gemini)
│       │            │
MariaDB MongoDB      MongoDB
```

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Backend API | Java 17, Spring Boot 3.3.5, Spring Security, JPA, MariaDB |
| Messaging Service | Node.js, Express, Socket.io, MongoDB |
| AI Chat Service | Node.js, Express, Google Gemini 2.5 Flash, MongoDB |
| Web App | React 19, TypeScript, Vite, TailwindCSS v4, Zustand |
| Mobile App | React Native 0.81, Expo SDK 54 |
| API Gateway | Nginx |
| DevOps | Docker, Docker Compose, GitHub Actions, AWS EC2 |
| Message Queue | RabbitMQ |
| Tracing | Zipkin |

---

## Tính Năng Chính

### Người thuê (Student/Tenant)
- Tìm kiếm phòng theo khu vực, giá, loại phòng
- Tìm phòng gần địa điểm (trường, bệnh viện...) trên bản đồ
- So sánh nhiều phòng cùng lúc
- Đặt phòng và thanh toán qua VNPay
- Đánh giá phòng đã thuê
- Lưu phòng yêu thích
- Chat với chủ nhà

### Chủ nhà (Landlord)
- Đăng tin phòng trọ (ảnh, tiện ích, vị trí GPS)
- Quản lý đơn đặt phòng
- Xem thống kê doanh thu

### RoomAI (AI Chatbot)
- Tư vấn tìm phòng bằng ngôn ngữ tự nhiên
- Tìm kiếm phòng thông minh theo yêu cầu người dùng
- Streaming response (Google Gemini 2.5 Flash)
- Lưu lịch sử hội thoại

### Admin
- Quản lý người dùng và phòng trọ
- Khóa tài khoản vi phạm
- Thống kê hệ thống

---

## Cấu Trúc Dự Án

```
SmartAccommodationFinder/
├── backend/
│   ├── spring-boot-api/      # Core API (Java Spring Boot)
│   ├── nodejs-service/       # Messaging service (Node.js + Socket.io)
│   └── ai-chat-service/      # RoomAI chatbot (Node.js + Gemini)
├── frontend/
│   ├── web-app/              # React web application
│   └── mobile-app/           # React Native mobile app
├── nginx/                    # API Gateway config
├── docker-compose.yml        # Development
└── docker-compose.prod.yml   # Production
```

---

## Chạy Dự Án (Development)

### Yêu cầu
- Docker & Docker Compose
- File `.env` với các biến môi trường (xem `.env.example`)

### Khởi động
```bash
docker compose up -d
```

Ứng dụng chạy tại: `http://localhost`

---

## Biến Môi Trường Cần Thiết

| Biến | Mô tả |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `AWS_ACCESS_KEY` | AWS S3 access key |
| `AWS_SECRET_KEY` | AWS S3 secret key |
| `JWT_SECRET` | JWT signing secret |
| `VNPAY_HASH_SECRET` | VNPay payment secret |
| `MAIL_USERNAME` | Email gửi OTP |
| `MAIL_PASSWORD` | Email app password |

---

## CI/CD

GitHub Actions tự động deploy lên AWS EC2 khi push lên nhánh `main`.
