import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true, // Set to false in production
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    // Define resources directly if not using HttpApi
    resources: {
      en: {
        translation: {
          "appName": "ordring Food",
          "createSessionTitle": "Create New Order Session",
          "sessionTitleLabel": "Session Title (e.g., Lunch Order)",
          "phoneNumberLabel": "Your Phone Number (for contact)",
          "createSessionButton": "Start Ordering Session",
          "joinSessionTitle": "Join Order Session",
          "enterSessionCodeLabel": "Enter Session Code or Link",
          "joinButton": "Join",
          "yourNameLabel": "Your Name",
          "liveOrderBoardTitle": "Live Order Board",
          "addItemPrompt": "What would you like to order?",
          "addItemButton": "Add Item",
          "sessionLockedMessage": "Ordering is closed. Waiting for final prices.",
          "invoiceEditorTitle": "Edit Invoice Prices (Admin)",
          "itemLabel": "Item",
          "priceLabel": "Price",
          "savePricesButton": "Save Prices",
          "invoiceViewTitle": "Your Order Summary",
          "totalLabel": "Total",
          "paymentStatusTitle": "Payment Status",
          "markAsPaidButton": "I Have Paid",
          "paidStatus": "Paid",
          "unpaidStatus": "Unpaid",
          "adminPhoneNumber": "Admin Contact",
          "finalizeSessionButton": "Finalize & Delete Session (Admin)",
          "exportPdfButton": "Export as PDF",
          "exportCsvButton": "Export as CSV",
          "language": "Language",
          "english": "English",
          "arabic": "Arabic",
          "recommendations": "Others are ordering:",
          "error": {
            "title": "Error",
            "generic": "Something went wrong",
            "nameAndItemRequired": "Name and item description are required",
            "addOrderFailed": "Failed to add order",
            "updateStatusFailed": "Failed to update status",
            "savePricesFailed": "Failed to save prices",
            "firebase": {
              "auth/user-not-found": "User not found",
              "auth/wrong-password": "Invalid password",
              "permission-denied": "You don't have permission to perform this action"
              // Add more Firebase error codes as needed
            }
          },
          "enterYourNameTitle": "Enter Your Name to Participate",
          "setNameButton": "Set Name",
          "nameNeededForOrder": "Your name is needed to place orders and track payments",
          "loading": "Loading...",
          "sessionIdLabel": "Session ID",
          "adminNameLabel": "Admin",
          "adminRole": "You are Admin",
          "adminControlsTitle": "Admin Controls",
          "lockOrderingButton": "Lock Ordering",
          "unlockOrderingButton": "Re-open Ordering",
          "checkoutFeesTitle": "Set Checkout Fees",
          "adminOnlyBadge": "Admin Only",
          "feesDescription": "Set VAT and delivery fees to calculate final totals",
          "vatPercentageLabel": "VAT Percentage",
          "deliveryFeeLabel": "Delivery Fee",
          "saving": "Saving",
          "saveFees": "Save Fees",
          "itemDescriptionLabel": "Item Description",
          "itemPlaceholder": "e.g., 1x Pepperoni Pizza, 2x Coke",
          "noOrdersYet": "No orders have been placed yet",
          "orderedByLabel": "Ordered By",
          "enterPricePlaceholder": "0.00",
          "pendingPrice": "Pending",
          "invoiceSummaryTitle": "Invoice Summary",
          "subTotalLabel": "Sub Total",
          "vatAmountLabel": "VAT Amount",
          "deliveryShareLabel": "Delivery Share",
          "memberTotalLabel": "Member Total",
          "statusLabel": "Status",
          "actionLabel": "Action",
          "markAsUnpaidButton": "Mark as Unpaid",
          "vatAppliedLabel": "VAT Applied",
          "totalDeliveryFeeLabel": "Total Delivery",
          "grandTotalLabel": "Grand Total",
          "areYouSure": "Are you sure?",
          "finalizeWarning": "This action cannot be undone",
          "cancel": "Cancel",
          "continue": "Continue",
          "orderingLockedTitle": "Ordering Locked",
          "sessionFinalizedTitle": "Session Finalized",
          "sessionFinalizedMessage": "This session has been finalized",
          "memberNameLabel": "Member Name"
        }
      },
      ar: {
        translation: {
          "appName": "أوردرينج فود",
          "createSessionTitle": "إنشاء جلسة طلب جديدة",
          "sessionTitleLabel": "عنوان الجلسة (مثال: طلب الغداء)",
          "phoneNumberLabel": "رقم هاتفك (للتواصل)",
          "createSessionButton": "بدء جلسة الطلب",
          "joinSessionTitle": "الانضمام إلى جلسة الطلب",
          "enterSessionCodeLabel": "أدخل رمز الجلسة أو الرابط",
          "joinButton": "انضمام",
          "yourNameLabel": "اسمك",
          "liveOrderBoardTitle": "لوحة الطلبات المباشرة",
          "addItemPrompt": "ماذا تود أن تطلب؟",
          "addItemButton": "إضافة عنصر",
          "sessionLockedMessage": "الطلب مغلق. في انتظار الأسعار النهائية.",
          "invoiceEditorTitle": "تعديل أسعار الفاتورة (المسؤول)",
          "itemLabel": "العنصر",
          "priceLabel": "السعر",
          "savePricesButton": "حفظ الأسعار",
          "invoiceViewTitle": "ملخص طلبك",
          "totalLabel": "المجموع",
          "paymentStatusTitle": "حالة الدفع",
          "markAsPaidButton": "لقد دفعت",
          "paidStatus": "مدفوع",
          "unpaidStatus": "غير مدفوع",
          "adminPhoneNumber": "رقم هاتف المسؤول",
          "finalizeSessionButton": "إنهاء وحذف الجلسة (المسؤول)",
          "exportPdfButton": "تصدير كـ PDF",
          "exportCsvButton": "تصدير كـ CSV",
          "language": "اللغة",
          "english": "الإنجليزية",
          "arabic": "العربية",
          "recommendations": "آخرون يطلبون:",
          "enterYourNameTitle": "أدخل اسمك للمشاركة",
          "setNameButton": "تعيين الاسم",
          "nameNeededForOrder": "اسمك مطلوب لتقديم الطلبات وتتبع المدفوعات",
          "loading": "جاري التحميل...",
          "sessionIdLabel": "رقم الجلسة",
          "adminNameLabel": "المسؤول",
          "adminRole": "أنت المسؤول",
          "adminControlsTitle": "تحكم المسؤول",
          "lockOrderingButton": "قفل الطلبات",
          "unlockOrderingButton": "إعادة فتح الطلبات",
          "checkoutFeesTitle": "تعيين رسوم الدفع",
          "adminOnlyBadge": "المسؤول فقط",
          "feesDescription": "تعيين ضريبة القيمة المضافة ورسوم التوصيل",
          "vatPercentageLabel": "نسبة الضريبة",
          "deliveryFeeLabel": "رسوم التوصيل",
          "saving": "جاري الحفظ",
          "saveFees": "حفظ الرسوم",
          "itemDescriptionLabel": "وصف الطلب",
          "itemPlaceholder": "مثال: 1 بيتزا بيبروني، 2 كولا",
          "noOrdersYet": "لم يتم تقديم أي طلبات بعد",
          "orderedByLabel": "طلب بواسطة",
          "enterPricePlaceholder": "0.00",
          "pendingPrice": "معلق",
          "invoiceSummaryTitle": "ملخص الفاتورة",
          "subTotalLabel": "المجموع الفرعي",
          "vatAmountLabel": "مبلغ الضريبة",
          "deliveryShareLabel": "حصة التوصيل",
          "memberTotalLabel": "إجمالي العضو",
          "statusLabel": "الحالة",
          "actionLabel": "الإجراء",
          "markAsUnpaidButton": "تعليم كغير مدفوع",
          "vatAppliedLabel": "الضريبة المطبقة",
          "totalDeliveryFeeLabel": "إجمالي التوصيل",
          "grandTotalLabel": "المجموع الكلي",
          "areYouSure": "هل أنت متأكد؟",
          "finalizeWarning": "لا يمكن التراجع عن هذا الإجراء",
          "cancel": "إلغاء",
          "continue": "متابعة",
          "orderingLockedTitle": "الطلبات مغلقة",
          "sessionFinalizedTitle": "تم إنهاء الجلسة",
          "sessionFinalizedMessage": "تم إنهاء هذه الجلسة",
          "memberNameLabel": "اسم العضو"
        }
      }
    }
  });

// Add custom error types for better error handling
export class OrderingError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'OrderingError';
  }
}

// Error handling utility function
const handleError = (error: unknown) => {
  if (error instanceof OrderingError) {
    console.error(error.message, error.code);
  } else {
    console.error(i18n.t('error.generic'));
  }
};



export default i18n;

