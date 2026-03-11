document.addEventListener('DOMContentLoaded', function () {
  const danhSachHocSinh = [
    { ma: 'JS-202603-001', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6A', trangThai: 'dang-hoc' },
    { ma: 'JS-202603-002', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6B', trangThai: 'dang-hoc' },
    { ma: 'JS-202603-003', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6C', trangThai: 'nghi-hoc' },
    { ma: 'JS-202603-004', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6B', trangThai: 'dang-hoc' },
    { ma: 'JS-202603-005', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6A', trangThai: 'dang-hoc' },
    { ma: 'JS-202603-006', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nữ', lop: '6B', trangThai: 'nghi-hoc' },
    { ma: 'JS-202603-007', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6A', trangThai: 'dang-hoc' },
    { ma: 'JS-202603-008', hoTen: 'Nguyen Van A', ngaySinh: '15/03/2010', gioiTinh: 'Nam', lop: '6C', trangThai: 'dang-hoc' },
  ];
  const inputTimKiem   = document.getElementById('tim-kiem');
  const selectLop      = document.getElementById('loc-lop');
  const selectTrangThai = document.getElementById('loc-trang-thai');
  const hienThiLop     = document.getElementById('hien-thi-lop');
  const hienThiTrangThai = document.getElementById('hien-thi-trang-thai');
  const nutTimKiem     = document.getElementById('nut-tim-kiem');
  const nutDatLai      = document.getElementById('nut-dat-lai');
  const bangThan       = document.getElementById('bang-than');
  const overlay        = document.getElementById('overlay');
  const popup          = document.getElementById('popup');
  const popupNoiDung   = document.getElementById('popup-noi-dung');
  const popupNutHuy    = document.getElementById('popup-nut-huy');
  selectLop.addEventListener('change', function () {
    hienThiLop.textContent = this.value ? this.options[this.selectedIndex].text : 'Chọn lớp';
  });

  selectTrangThai.addEventListener('change', function () {
    hienThiTrangThai.textContent = this.value ? this.options[this.selectedIndex].text : 'Chọn trạng thái';
  });
  function renderBang(ds) {
    bangThan.innerHTML = '';
    ds.forEach(function (hs) {
      const tenTrangThai = hs.trangThai === 'dang-hoc' ? 'Đang học' : 'Nghỉ học';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${hs.ma}</td>
        <td>${hs.hoTen}</td>
        <td>${hs.ngaySinh}</td>
        <td>${hs.gioiTinh}</td>
        <td>${hs.lop}</td>
        <td><span class="trang-thai ${hs.trangThai}">${tenTrangThai}</span></td>
      `;
      bangThan.appendChild(tr);
    });
  }
  function hienPopup(noiDung) {
    popupNoiDung.textContent = noiDung;
    overlay.classList.add('hien');
    popup.classList.add('hien');
  }

  function anPopup() {
    overlay.classList.remove('hien');
    popup.classList.remove('hien');
  }

  popupNutHuy.addEventListener('click', anPopup);
  overlay.addEventListener('click', anPopup);
  nutTimKiem.addEventListener('click', function () {
    const tuKhoa     = inputTimKiem.value.trim().toLowerCase();
    const lopChon    = selectLop.value;
    const trangThai  = selectTrangThai.value;

    const ketQua = danhSachHocSinh.filter(function (hs) {
      const hopTuKhoa   = !tuKhoa || hs.hoTen.toLowerCase().includes(tuKhoa) || hs.ma.toLowerCase().includes(tuKhoa);
      const hopLop      = !lopChon || hs.lop === lopChon;
      const hopTrangThai = !trangThai || hs.trangThai === trangThai;
      return hopTuKhoa && hopLop && hopTrangThai;
    });

    if (ketQua.length === 0) {
      renderBang([]);
      hienPopup('Không tìm thấy học sinh phù hợp!');
    } else {
      renderBang(ketQua);
    }
  });
  nutDatLai.addEventListener('click', function () {
    inputTimKiem.value = '';
    selectLop.value    = '';
    selectTrangThai.value = '';
    hienThiLop.textContent = 'Chọn lớp';
    hienThiTrangThai.textContent = 'Chọn trạng thái';
    renderBang(danhSachHocSinh);
  });
  inputTimKiem.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') nutTimKiem.click();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && popup.classList.contains('hien')) anPopup();
  });
  renderBang(danhSachHocSinh);

});