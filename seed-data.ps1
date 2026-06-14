[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost/api"

function Invoke-Api($method, $path, $body, $token) {
    $headers = @{ "Content-Type" = "application/json; charset=utf-8" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    try {
        if ($body) {
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
            return Invoke-RestMethod -Uri "$baseUrl$path" -Method $method -Body $bytes -Headers $headers
        } else {
            return Invoke-RestMethod -Uri "$baseUrl$path" -Method $method -Headers $headers
        }
    } catch {
        Write-Host "  ERROR [$method $path]: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ── 1. Đăng ký 5 tài khoản chủ trọ ───────────────────────────────────────
Write-Host "`n=== ĐĂNG KÝ 5 TÀI KHOẢN CHỦ TRỌ ===" -ForegroundColor Cyan

$landlords = @(
    @{ phone = "0901111001"; fullName = "Nguyễn Văn An";   email = "nguyenvanan01@gmail.com" },
    @{ phone = "0901111002"; fullName = "Trần Thị Bình";   email = "tranthichibinh02@gmail.com" },
    @{ phone = "0901111003"; fullName = "Lê Minh Cường";   email = "leminhcuong03@gmail.com" },
    @{ phone = "0901111004"; fullName = "Phạm Thị Dung";   email = "phamthidung04@gmail.com" },
    @{ phone = "0901111005"; fullName = "Hoàng Văn Em";    email = "hoangvanem05@gmail.com" }
)

foreach ($l in $landlords) {
    $body = [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::UTF8.GetBytes(
        ('{"phone":"' + $l.phone + '","fullName":"' + $l.fullName + '","password":"123456","email":"' + $l.email + '","role":"LANDLORD"}')
    ))
    $res = Invoke-Api "Post" "/auth/register" $body
    if ($res) { Write-Host "  OK: $($l.fullName) ($($l.phone))" -ForegroundColor Green }
    else       { Write-Host "  SKIP: $($l.phone) (có thể đã tồn tại)" -ForegroundColor Yellow }
}

# ── 2. Đăng nhập lấy token ────────────────────────────────────────────────
Write-Host "`n=== ĐĂNG NHẬP LẤY TOKEN ===" -ForegroundColor Cyan

$tokens = @()
foreach ($l in $landlords) {
    $body = '{"phone":"' + $l.phone + '","password":"123456"}'
    $res = Invoke-Api "Post" "/auth/login" $body
    if ($res -and $res.data.accessToken) {
        $tokens += $res.data.accessToken
        Write-Host "  OK: $($l.fullName)" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: $($l.fullName)" -ForegroundColor Red
        $tokens += $null
    }
}

# ── 3. Xóa phòng cũ của 5 chủ trọ ────────────────────────────────────────
Write-Host "`n=== XÓA PHÒNG CŨ ===" -ForegroundColor Cyan

for ($i = 0; $i -lt 5; $i++) {
    $token = $tokens[$i]
    if (-not $token) { continue }
    $res = Invoke-Api "Get" "/rooms/my?page=0&size=50" $null $token
    if ($res -and $res.data.content) {
        foreach ($room in $res.data.content) {
            $del = Invoke-Api "Delete" "/rooms/$($room.id)" $null $token
            if ($del) { Write-Host "  Đã xóa: $($room.title)" -ForegroundColor DarkGray }
        }
    }
}

# ── 4. Dữ liệu 30 phòng (6 phòng mỗi chủ) ────────────────────────────────
$roomGroups = @(

    # ── Chủ 1: Nguyễn Văn An — Q1, Q3, Bình Thạnh ──
    @(
        @{ title="Phòng trọ cao cấp Quận 1"; description="Phòng đẹp, sạch sẽ, gần trung tâm, đầy đủ tiện nghi"; price=5000000; address="123 Lý Tự Trọng"; district="Quận 1"; city="TP Hồ Chí Minh"; lat=10.7769; lon=106.6981; area=25; roomType="SINGLE"; amenities=@("WIFI","AIR_CONDITIONER","PRIVATE_BATHROOM") },
        @{ title="Phòng đơn giá rẻ gần Bến Thành"; description="Vị trí vàng, đi bộ đến Bến Thành 5 phút"; price=4500000; address="45 Phạm Ngũ Lão"; district="Quận 1"; city="TP Hồ Chí Minh"; lat=10.7695; lon=106.6929; area=20; roomType="SINGLE"; amenities=@("WIFI") },
        @{ title="Căn hộ mini Quận 3 tiện nghi"; description="Căn hộ đầy đủ nội thất, gần Hồ Con Rùa"; price=6500000; address="67 Võ Văn Tần"; district="Quận 3"; city="TP Hồ Chí Minh"; lat=10.7747; lon=106.6875; area=35; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","KITCHEN") },
        @{ title="Phòng ghép Quận 3 giá sinh viên"; description="Phòng rộng, an ninh tốt, có bếp chung"; price=2800000; address="34 Trần Cao Vân"; district="Quận 3"; city="TP Hồ Chí Minh"; lat=10.7810; lon=106.6850; area=18; roomType="SHARED"; amenities=@("WIFI","KITCHEN") },
        @{ title="Phòng trọ Bình Thạnh gần trường"; description="Gần ĐH Văn Lang, an ninh tốt, có chỗ để xe"; price=3500000; address="89 Bạch Đằng"; district="Bình Thạnh"; city="TP Hồ Chí Minh"; lat=10.8050; lon=106.7100; area=22; roomType="SINGLE"; amenities=@("WIFI","PARKING","SECURITY") },
        @{ title="Phòng đôi Phú Nhuận đầy đủ"; description="WC riêng, máy giặt chung, bao gồm điện nước"; price=4000000; address="12 Huỳnh Văn Bánh"; district="Phú Nhuận"; city="TP Hồ Chí Minh"; lat=10.7995; lon=106.6784; area=28; roomType="SHARED"; amenities=@("WIFI","AIR_CONDITIONER","WASHING_MACHINE") }
    ),

    # ── Chủ 2: Trần Thị Bình — Q7, Q4, Nhà Bè ──
    @(
        @{ title="Phòng cao cấp Quận 7 gần Lotte"; description="Phòng mới, thoáng mát, view đẹp, thu hai thứ tư"; price=5500000; address="15 Nguyễn Thị Thập"; district="Quận 7"; city="TP Hồ Chí Minh"; lat=10.7285; lon=106.7100; area=30; roomType="SINGLE"; amenities=@("WIFI","AIR_CONDITIONER","PRIVATE_BATHROOM","PARKING") },
        @{ title="Căn hộ đẹp Quận 7 full nội thất"; description="Căn hộ 1PN đầy đủ nội thất cao cấp"; price=7000000; address="88 Nguyễn Lương Bằng"; district="Quận 7"; city="TP Hồ Chí Minh"; lat=10.7350; lon=106.7200; area=40; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","WASHING_MACHINE","KITCHEN","ELEVATOR") },
        @{ title="Phòng ghép Quận 7 giá tốt"; description="Phòng rộng thoáng, cho phép nuôi thú cưng"; price=2500000; address="22 Tân Thuận Đông"; district="Quận 7"; city="TP Hồ Chí Minh"; lat=10.7300; lon=106.7150; area=20; roomType="SHARED"; amenities=@("WIFI","PET_ALLOWED") },
        @{ title="Phòng trọ Quận 4 tiện lợi"; description="Gần cầu Khánh Hội, đi trung tâm dễ"; price=4000000; address="56 Xóm Chiếu"; district="Quận 4"; city="TP Hồ Chí Minh"; lat=10.7580; lon=106.7050; area=25; roomType="SINGLE"; amenities=@("WIFI","AIR_CONDITIONER") },
        @{ title="Phòng đơn Quận 4 giá sinh viên"; description="An ninh 24/7, camera, khóa vân tay"; price=3500000; address="33 Tôn Đản"; district="Quận 4"; city="TP Hồ Chí Minh"; lat=10.7510; lon=106.7000; area=18; roomType="SINGLE"; amenities=@("WIFI","SECURITY") },
        @{ title="Phòng trọ Nhà Bè giá rẻ"; description="Gần KCN Hiệp Phước, thích hợp công nhân"; price=2000000; address="10 Huỳnh Tấn Phát"; district="Nhà Bè"; city="TP Hồ Chí Minh"; lat=10.6950; lon=106.7100; area=16; roomType="SINGLE"; amenities=@("WIFI") }
    ),

    # ── Chủ 3: Lê Minh Cường — Thủ Đức, Q9 ──
    @(
        @{ title="Phòng trọ gần ĐH Quốc Gia"; description="Cách cổng ĐH Quốc Gia 500m, yên tĩnh học tập"; price=3000000; address="100 Võ Văn Ngân"; district="Thủ Đức"; city="TP Hồ Chí Minh"; lat=10.8500; lon=106.7700; area=20; roomType="SINGLE"; amenities=@("WIFI","PRIVATE_BATHROOM") },
        @{ title="Phòng đôi gần ĐHBK"; description="Gần Bách Khoa, có xe bus trước cửa"; price=3200000; address="68 Lý Thường Kiệt"; district="Thủ Đức"; city="TP Hồ Chí Minh"; lat=10.8630; lon=106.8020; area=22; roomType="SHARED"; amenities=@("WIFI","PARKING") },
        @{ title="Căn hộ mini Thủ Đức view đẹp"; description="Tầng cao, view sông, gần Vincom Thủ Đức"; price=5000000; address="15 Kha Vạn Cân"; district="Thủ Đức"; city="TP Hồ Chí Minh"; lat=10.8600; lon=106.7600; area=35; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","ELEVATOR") },
        @{ title="Phòng trọ Quận 9 yên tĩnh"; description="Khu dân cư an ninh, có chỗ để xe ô tô"; price=2800000; address="45 Đỗ Xuân Hợp"; district="Quận 9"; city="TP Hồ Chí Minh"; lat=10.8400; lon=106.8200; area=24; roomType="SINGLE"; amenities=@("WIFI","PARKING","AIR_CONDITIONER") },
        @{ title="Phòng đơn Linh Xuân giá mềm"; description="Phòng mới xây, WC riêng, tủ đựng đồ"; price=2500000; address="77 Hinh Quả"; district="Thủ Đức"; city="TP Hồ Chí Minh"; lat=10.8700; lon=106.7800; area=18; roomType="SINGLE"; amenities=@("WIFI","PRIVATE_BATHROOM") },
        @{ title="Phòng ghép Hiệp Bình Phước"; description="Gần cầu Bình Triệu, thuận tiện di chuyển"; price=2000000; address="38 Đường số 38"; district="Thủ Đức"; city="TP Hồ Chí Minh"; lat=10.8440; lon=106.7120; area=16; roomType="SHARED"; amenities=@("WIFI") }
    ),

    # ── Chủ 4: Phạm Thị Dung — Gò Vấp, Tân Bình, Tân Phú ──
    @(
        @{ title="Phòng trọ Gò Vấp an ninh"; description="Khu vực an ninh, có bảo vệ 24/7, gần chợ Gò Vấp"; price=3500000; address="55 Nguyễn Oanh"; district="Gò Vấp"; city="TP Hồ Chí Minh"; lat=10.8384; lon=106.6641; area=22; roomType="SINGLE"; amenities=@("WIFI","SECURITY","PARKING") },
        @{ title="Căn hộ Gò Vấp full nội thất"; description="Căn hộ 1PN đẹp, yên tĩnh, gần trường"; price=5500000; address="23 Phan Văn Trị"; district="Gò Vấp"; city="TP Hồ Chí Minh"; lat=10.8300; lon=106.6700; area=38; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","KITCHEN","WASHING_MACHINE") },
        @{ title="Phòng ghép Gò Vấp sinh viên"; description="4 người/phòng, tủ đồ riêng, vệ sinh sạch sẽ"; price=1500000; address="10 Nguyễn Du"; district="Gò Vấp"; city="TP Hồ Chí Minh"; lat=10.8450; lon=106.6580; area=40; roomType="SHARED"; amenities=@("WIFI","WASHING_MACHINE") },
        @{ title="Phòng trọ Tân Bình gần sân bay"; description="Cách sân bay Tân Sơn Nhất 2km, thuận tiện"; price=4000000; address="34 Cộng Hòa"; district="Tân Bình"; city="TP Hồ Chí Minh"; lat=10.7952; lon=106.6525; area=25; roomType="SINGLE"; amenities=@("WIFI","AIR_CONDITIONER","PRIVATE_BATHROOM") },
        @{ title="Phòng đơn Tân Bình tiện nghi"; description="Gần chuỗi siêu thị, trường học, bệnh viện"; price=3200000; address="78 Hoàng Văn Thụ"; district="Tân Bình"; city="TP Hồ Chí Minh"; lat=10.8000; lon=106.6600; area=20; roomType="SINGLE"; amenities=@("WIFI","AIR_CONDITIONER") },
        @{ title="Phòng trọ Tân Phú mát mẻ"; description="Thoáng mát, nhiều cây xanh, yên tĩnh"; price=3000000; address="45 Âu Cơ"; district="Tân Phú"; city="TP Hồ Chí Minh"; lat=10.7930; lon=106.6290; area=20; roomType="SINGLE"; amenities=@("WIFI","PARKING") }
    ),

    # ── Chủ 5: Hoàng Văn Em — Q6, Q8, Bình Tân ──
    @(
        @{ title="Phòng trọ Quận 6 sạch sẽ"; description="Gần Chợ Lớn, phòng sạch, chủ nhà dễ tính"; price=3500000; address="12 Lý Chiêu Hoàng"; district="Quận 6"; city="TP Hồ Chí Minh"; lat=10.7490; lon=106.6360; area=22; roomType="SINGLE"; amenities=@("WIFI","AIR_CONDITIONER") },
        @{ title="Căn hộ Quận 6 full nội thất"; description="Căn hộ 1PN, full nội thất cao cấp, gần ngân hàng"; price=5000000; address="56 Bàu Cát"; district="Quận 6"; city="TP Hồ Chí Minh"; lat=10.7550; lon=106.6400; area=36; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","KITCHEN","ELEVATOR") },
        @{ title="Phòng ghép Quận 6 giá rẻ"; description="Phòng rộng, cho nhiều người, chia sẻ chi phí"; price=1800000; address="90 Phạm Văn Chí"; district="Quận 6"; city="TP Hồ Chí Minh"; lat=10.7520; lon=106.6380; area=30; roomType="SHARED"; amenities=@("WIFI") },
        @{ title="Phòng trọ Quận 8 tiện lợi"; description="Gần cầu, kết nối trung tâm nhanh chóng"; price=3000000; address="34 Phụng Hưng"; district="Quận 8"; city="TP Hồ Chí Minh"; lat=10.7245; lon=106.6780; area=20; roomType="SINGLE"; amenities=@("WIFI","PRIVATE_BATHROOM","PARKING") },
        @{ title="Phòng đơn Quận 8 giá mềm"; description="Phòng mới xây, WC riêng, máy nước nóng"; price=2800000; address="67 Tùng Thiện Vương"; district="Quận 8"; city="TP Hồ Chí Minh"; lat=10.7280; lon=106.6850; area=18; roomType="SINGLE"; amenities=@("WIFI","PRIVATE_BATHROOM","WATER_HEATER") },
        @{ title="Phòng trọ Bình Tân giá rẻ nhất"; description="Gần KCN Tân Tạo, phù hợp công nhân"; price=2000000; address="22 Kinh Dương Vương"; district="Bình Tân"; city="TP Hồ Chí Minh"; lat=10.7630; lon=106.6080; area=15; roomType="SINGLE"; amenities=@("WIFI") }
    )
)

# ── 5. Tạo 30 phòng ────────────────────────────────────────────────────────
Write-Host "`n=== TẠO 30 PHÒNG TRỌ ===" -ForegroundColor Cyan

$ok = 0; $fail = 0
for ($i = 0; $i -lt 5; $i++) {
    $token = $tokens[$i]
    $landlord = $landlords[$i]
    if (-not $token) { Write-Host "  SKIP $($landlord.fullName) — không có token" -ForegroundColor Yellow; continue }

    Write-Host "  Chủ trọ: $($landlord.fullName)" -ForegroundColor White
    foreach ($room in $roomGroups[$i]) {
        $amenitiesJson = '["' + ($room.amenities -join '","') + '"]'
        $body = @"
{
  "title": "$($room.title)",
  "description": "$($room.description)",
  "price": $($room.price),
  "address": "$($room.address)",
  "district": "$($room.district)",
  "city": "$($room.city)",
  "latitude": $($room.lat),
  "longitude": $($room.lon),
  "area": $($room.area),
  "roomType": "$($room.roomType)",
  "imageUrls": [],
  "amenities": $amenitiesJson
}
"@
        $res = Invoke-Api "Post" "/rooms" $body $token
        if ($res -and $res.data) {
            Write-Host "    + $($room.title)" -ForegroundColor Green
            $ok++
        } else {
            Write-Host "    FAIL: $($room.title)" -ForegroundColor Red
            $fail++
        }
        Start-Sleep -Milliseconds 200
    }
}

# ── Tổng kết ───────────────────────────────────────────────────────────────
Write-Host "`n=== HOÀN THÀNH ===" -ForegroundColor Cyan
Write-Host "Kết quả: $ok thành công / $($ok+$fail) phòng" -ForegroundColor $(if ($fail -gt 0) { "Yellow" } else { "Green" })
Write-Host "`n5 tài khoản chủ trọ (mật khẩu: 123456):" -ForegroundColor White
foreach ($l in $landlords) {
    Write-Host "  SĐT: $($l.phone)  |  Tên: $($l.fullName)  |  Email: $($l.email)" -ForegroundColor Yellow
}
