[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$baseUrl = "http://localhost/api"

function Post-Api($path, $body, $token) {
    $headers = @{ "Content-Type" = "application/json; charset=utf-8" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    try {
        Invoke-RestMethod -Uri "$baseUrl$path" -Method Post -Body $bytes -Headers $headers
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Login all 5 landlords to get fresh tokens
$landlords = @(
    @{ phone = "0901111001"; fullName = "Nguyen Van An" },
    @{ phone = "0901111002"; fullName = "Tran Thi Binh" },
    @{ phone = "0901111003"; fullName = "Le Minh Cuong" },
    @{ phone = "0901111004"; fullName = "Pham Thi Dung" },
    @{ phone = "0901111005"; fullName = "Hoang Van Em" }
)

Write-Host "`n=== DANG NHAP DE LAY TOKEN ===" -ForegroundColor Cyan
$tokens = @()
foreach ($l in $landlords) {
    $body = '{"phone":"' + $l.phone + '","password":"123456"}'
    $res = Post-Api "/auth/login" $body
    if ($res -and $res.data.accessToken) {
        $tokens += $res.data.accessToken
        Write-Host "  OK: $($l.fullName)" -ForegroundColor Green
    } else {
        Write-Host "  FAIL: $($l.fullName)" -ForegroundColor Red
        $tokens += $null
    }
}

# 8 missing rooms with corrected enum values (FRIDGE->REFRIGERATOR, SECURITY_CAMERA->SECURITY)
$missingRooms = @(
    # Landlord 1 (index 0)
    @{ landlordIdx=0; title="Can ho mini Quan 3 tien nghi"; description="Can ho day du noi that, gan Ho Con Rua"; price=6500000; address="67 Vo Van Tan"; district="Quan 3"; city="TP Ho Chi Minh"; lat=10.7747; lon=106.6875; area=35; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","KITCHEN") },
    @{ landlordIdx=0; title="Phong tro Binh Thanh gan truong"; description="Gan DH Van Lang, an ninh tot, cho de xe"; price=3500000; address="89 Bach Dang"; district="Binh Thanh"; city="TP Ho Chi Minh"; lat=10.8050; lon=106.7100; area=22; roomType="SINGLE"; amenities=@("WIFI","PARKING","SECURITY") },
    # Landlord 2 (index 1)
    @{ landlordIdx=1; title="Can ho dep Quan 7 full NT"; description="Can ho 1PN day du noi that cao cap"; price=7000000; address="88 Nguyen Luong Bang"; district="Quan 7"; city="TP Ho Chi Minh"; lat=10.7350; lon=106.7200; area=40; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","WASHING_MACHINE","KITCHEN","ELEVATOR") },
    @{ landlordIdx=1; title="Phong don Quan 4 gia sinh vien"; description="An ninh 24/7, camera, khoa van tay"; price=3500000; address="33 Ton Dan"; district="Quan 4"; city="TP Ho Chi Minh"; lat=10.7510; lon=106.7000; area=18; roomType="SINGLE"; amenities=@("WIFI","SECURITY") },
    # Landlord 3 (index 2)
    @{ landlordIdx=2; title="Can ho mini Thu Duc view dep"; description="Tang cao, view song, gan vincom Thu Duc"; price=5000000; address="15 Kha Van Can"; district="Thu Duc"; city="TP Ho Chi Minh"; lat=10.8600; lon=106.7600; area=35; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","ELEVATOR") },
    # Landlord 4 (index 3)
    @{ landlordIdx=3; title="Phong tro Go Vap an ninh"; description="Khu vuc an ninh, co bao ve 24/7, gan cho Go Vap"; price=3500000; address="55 Nguyen Oanh"; district="Go Vap"; city="TP Ho Chi Minh"; lat=10.8384; lon=106.6641; area=22; roomType="SINGLE"; amenities=@("WIFI","SECURITY","PARKING") },
    @{ landlordIdx=3; title="Can ho Go Vap full noi that"; description="Can ho 1PN dep, yen tinh, gan truong"; price=5500000; address="23 Phan Van Tri"; district="Go Vap"; city="TP Ho Chi Minh"; lat=10.8300; lon=106.6700; area=38; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","KITCHEN","WASHING_MACHINE") },
    # Landlord 5 (index 4)
    @{ landlordIdx=4; title="Can ho Quan 6 full noi that"; description="Can ho 1PN, full noi that cao cap, ngan hang gan"; price=5000000; address="56 Bau Cat"; district="Quan 6"; city="TP Ho Chi Minh"; lat=10.7550; lon=106.6400; area=36; roomType="APARTMENT"; amenities=@("WIFI","AIR_CONDITIONER","REFRIGERATOR","KITCHEN","ELEVATOR") }
)

Write-Host "`n=== TAO 8 PHONG CON THIEU ===" -ForegroundColor Cyan
$ok = 0; $fail = 0
foreach ($room in $missingRooms) {
    $token = $tokens[$room.landlordIdx]
    if (-not $token) { Write-Host "  SKIP (no token): $($room.title)" -ForegroundColor Yellow; $fail++; continue }
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
    $res = Post-Api "/rooms" $body $token
    if ($res -and $res.data) {
        Write-Host "  + $($room.title)" -ForegroundColor Green
        $ok++
    } else {
        Write-Host "  FAIL: $($room.title)" -ForegroundColor Red
        $fail++
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "`n=== KET QUA ===" -ForegroundColor Cyan
Write-Host "Thanh cong: $ok/8" -ForegroundColor Green
Write-Host "That bai:   $fail/8" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })
