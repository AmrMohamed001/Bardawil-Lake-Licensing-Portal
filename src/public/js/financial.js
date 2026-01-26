// Financial Module Client Scripts

// View payment details
async function viewPaymentDetails(applicationId) {
  try {
    openModal();
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="text-center p-4">
            <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
            <p class="mt-2">جاري التحميل...</p>
        </div>
    `;

    const response = await axios.get(`/api/v1/financial/payment/${applicationId}`);

    // Check if success
    if (!response.data || !response.data.success) {
      alert('خطأ في تحميل البيانات');
      closeModal();
      return;
    }

    const app = response.data.data;

    // Find receipt document
    const receiptDoc = app.documents && app.documents.find(d => d.fileName === app.paymentReceiptPath || d.documentType === 'payment_receipt');

    // Helper to clean path
    const getCleanPath = (path) => {
      if (!path) return null;
      let clean = path.replace(/\\/g, '/');
      if (clean.startsWith('src/public/')) clean = clean.replace('src/public/', '/');
      else if (clean.startsWith('public/')) clean = clean.replace('public/', '/');
      if (!clean.startsWith('/')) clean = '/' + clean;
      return clean;
    };

    const receiptPath = getCleanPath(app.paymentReceiptPath) || (receiptDoc ? getCleanPath(receiptDoc.filePath) : null) || (receiptDoc ? `/uploads/${receiptDoc.fileName}` : null);


    modalBody.innerHTML = `
      <div class="payment-details">
        <div class="details-grid">
          <div class="detail-item">
            <label>رقم الطلب:</label>
            <span class="badge bg-info text-dark" style="width: fit-content;">${app.applicationNumber}</span>
          </div>
          <div class="detail-item">
            <label>اسم المتقدم:</label>
            <span>${app.applicant.firstNameAr} ${app.applicant.lastNameAr}</span>
          </div>
          <div class="detail-item">
            <label>الرقم القومي:</label>
            <span style="font-family: monospace;">${app.applicant.nationalId}</span>
          </div>
          <div class="detail-item">
            <label>المبلغ المطلوب:</label>
            <span class="text-success fw-bold fs-5">${app.paymentAmount || 0} جنيه مصري</span>
          </div>
        </div>

        <div class="document-preview">
          <h5><i class="fas fa-file-invoice"></i> إيصال الدفع المرفوع</h5>
          ${receiptPath ? `
            <div style="margin-top: 10px;">
                <a href="${receiptPath}" target="_blank" class="btn btn-outline-primary mb-2">
                    <i class="fas fa-external-link-alt"></i> فتح في نافذة جديدة
                </a>
                <br>
                ${receiptPath.toLowerCase().endsWith('.pdf')
          ? `<div class="alert alert-info"><i class="fas fa-file-pdf"></i> ملف PDF - اضغط للفتح</div>`
          : `<img src="${receiptPath}" alt="إيصال الدفع" class="receipt-image">`
        }
            </div>
          ` : '<div class="alert alert-warning">لم يتم العثور على ملف الإيصال</div>'}
        </div>

        <div class="verification-actions">
          <h5>إجراء التحقق</h5>
          <textarea 
            id="verificationNotes" 
            class="form-control mb-3" 
            placeholder="ملاحظات (اختياري)"
            rows="2"
          ></textarea>
          
          <div class="action-buttons">
            <button 
              class="btn btn-success"
              onclick="verifyPayment('${app.id}')"
            >
              <i class="fas fa-check-circle"></i>
              قبول وتحقق من الدفع
            </button>
            <button 
              class="btn btn-danger"
              onclick="showRejectForm('${app.id}')"
            >
              <i class="fas fa-times-circle"></i>
              رفض الإيصال
            </button>
          </div>
        </div>
      </div>
    `;

  } catch (error) {
    console.error('Error loading payment details:', error);
    alert('حدث خطأ في تحميل التفاصيل');
    closeModal();
  }
}

// Verify payment
async function verifyPayment(applicationId) {
  const notes = document.getElementById('verificationNotes').value;

  if (!confirm('هل أنت متأكد من صحة الإيصال والموافقة على الدفع؟')) {
    return;
  }

  try {
    const btn = document.querySelector('.action-buttons .btn-success');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';

    const response = await axios.post(`/api/v1/financial/verify-payment/${applicationId}`, { notes });

    if (response.data && response.data.success) {
      alert('تم التحقق بنجاح');
      closeModal();
      location.reload();
    } else {
      alert('حدث خطأ: ' + (response.data.message || 'Unknown error'));
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    alert(error.response?.data?.message || 'حدث خطأ في التحقق من الدفع');
    document.querySelector('.action-buttons .btn-success').disabled = false;
  }
}

// Show reject form
function showRejectForm(applicationId) {
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="reject-form">
      <h3 class="text-danger mb-3">رفض إيصال الدفع</h3>
      <div class="alert alert-warning">
        <i class="fas fa-exclamation-triangle"></i>
        سيتم إشعار المستخدم برفض الإيصال ومطالبته برفع إيصال جديد.
      </div>
      
      <div class="mb-3">
        <label class="form-label">سبب الرفض (مطلوب):</label>
        <textarea 
            id="rejectionReason" 
            class="form-control" 
            placeholder="يرجى توضيح سبب الرفض بالتفصيل (مثال: الإيصال غير واضح، المبلغ غير صحيح...)"
            rows="4"
        ></textarea>
        <div class="form-text">يجب أن يكون السبب 5 أحرف على الأقل.</div>
      </div>
      
      <div class="action-buttons">
        <button 
          class="btn btn-danger"
          onclick="confirmRejectPayment('${applicationId}')"
        >
          <i class="fas fa-times-circle"></i>
          تأكيد الرفض
        </button>
        <button 
          class="btn btn-secondary"
          onclick="viewPaymentDetails('${applicationId}')"
        >
          <i class="fas fa-arrow-left"></i>
          رجوع
        </button>
      </div>
    </div>
  `;
}

// Confirm reject payment
async function confirmRejectPayment(applicationId) {
  const reason = document.getElementById('rejectionReason').value.trim();

  if (reason.length < 5) {
    alert('يجب أن يكون السبب 5 أحرف على الأقل');
    return;
  }

  if (!confirm('هل أنت متأكد من رفض هذا الإيصال؟')) {
    return;
  }

  try {
    const btn = document.querySelector('.action-buttons .btn-danger');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';

    const response = await axios.post(`/api/v1/financial/reject-payment/${applicationId}`, { reason });

    if (response.data && response.data.success) {
      alert('تم رفض الإيصال بنجاح');
      closeModal();
      location.reload();
    }
  } catch (error) {
    console.error('Error rejecting payment:', error);
    alert(error.response?.data?.message || 'حدث خطأ في رفض الإيصال');
    document.querySelector('.action-buttons .btn-danger').disabled = false;
  }
}

// Modal functions
function openModal() {
  document.getElementById('paymentModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('paymentModal').classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById('paymentModal');
  if (event.target == modal) {
    closeModal();
  }
}
