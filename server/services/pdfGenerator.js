// server/services/pdfGenerator.js
import PDFDocument from 'pdfkit';
import { generateVerificationQR } from './qrService.js';

/**
 * Generates an official approved OD PDF.
 * @param {object} odRequest - The OD request object loaded with student, department, and logs.
 * @returns {Promise<Buffer>} Buffer containing the PDF data
 */
export async function generateApprovedOdPdf(odRequest) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // --- College Header Section ---
      doc.rect(0, 0, 595.28, 15).fill('#0F172A'); // Navy top accent bar
      doc.fillColor('#0F172A');

      doc.fontSize(16).font('Helvetica-Bold').text('KAMARAJ COLLEGE OF ENGINEERING AND TECHNOLOGY', 50, 40, { align: 'center' });
      doc.fontSize(10).font('Helvetica').fillColor('#64748B').text('Approved by AICTE | Affiliated to Anna University, Chennai', 50, 62, { align: 'center' });
      doc.text('S.P.G.C. Nagar, K. Vellakulam - 625 701, Near Virudhunagar, Tamil Nadu | www.kamarajengg.edu.in', 50, 76, { align: 'center' });
      
      // Divider
      doc.moveTo(50, 98).lineTo(545.28, 98).strokeColor('#E2E8F0').lineWidth(1.5).stroke();

      // --- Document Title ---
      doc.fillColor('#0F172A');
      doc.fontSize(14).font('Helvetica-Bold').text('OFFICIAL ON-DUTY (OD) APPROVAL LETTER', 50, 115, { align: 'center' });

      // --- OD Code & Issue Date ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E293B');
      doc.text(`OD Ref Code: ${odRequest.odCode}`, 50, 145);
      doc.font('Helvetica').text(`Issued Date: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 400, 145, { align: 'right' });

      // --- Student Info Box ---
      doc.rect(50, 165, 495, 80).fill('#F8FAFC').strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.fillColor('#0F172A');
      
      doc.fontSize(10).font('Helvetica-Bold').text('STUDENT PROFILE', 65, 175);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Name: ${odRequest.student.user.name}`, 65, 195);
      doc.text(`Reg. No: ${odRequest.student.regNo}`, 65, 210);
      doc.text(`Class: Year ${odRequest.student.year} - Sec ${odRequest.student.section}`, 65, 225);
      
      doc.text(`Department: ${odRequest.student.department.name} (${odRequest.student.department.code})`, 300, 195);
      doc.text(`Student Type: ${odRequest.student.type.replace('_', ' ')}`, 300, 210);
      doc.text(`Current Stage: APPROVED`, 300, 225);

      // --- Event & OD Details ---
      doc.fontSize(10).font('Helvetica-Bold').text('EVENT PARTICIPATION DETAILS', 50, 265);
      doc.moveTo(50, 278).lineTo(545.28, 278).strokeColor('#E2E8F0').lineWidth(1).stroke();

      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      
      let currentY = 290;
      const drawLabelValue = (label, value) => {
        doc.font('Helvetica-Bold').text(label, 50, currentY, { width: 120 });
        doc.font('Helvetica').text(value, 170, currentY, { width: 375 });
        currentY += 20;
      };

      drawLabelValue('Event Name:', odRequest.eventName);
      drawLabelValue('College Name:', odRequest.collegeName);
      drawLabelValue('Event Date:', new Date(odRequest.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' }));
      drawLabelValue('OD Duration:', `${new Date(odRequest.fromDate).toLocaleDateString('en-IN')} to ${new Date(odRequest.toDate).toLocaleDateString('en-IN')}`);
      
      // Multi-line Reason block
      doc.font('Helvetica-Bold').text('Purpose / Reason:', 50, currentY, { width: 120 });
      doc.font('Helvetica').text(odRequest.reason, 170, currentY, { width: 375, align: 'justify' });
      
      // Calculate height of reason block to push next elements dynamically
      const reasonHeight = doc.heightOfString(odRequest.reason, { width: 375 });
      currentY += Math.max(reasonHeight + 20, 40);

      // --- Approval Timeline / Sign-offs ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0F172A').text('DIGITAL APPROVAL SIGN-OFFS', 50, currentY);
      currentY += 13;
      doc.moveTo(50, currentY).lineTo(545.28, currentY).strokeColor('#E2E8F0').lineWidth(1).stroke();
      currentY += 12;

      doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
      odRequest.logs.forEach((log) => {
        const dateStr = new Date(log.timestamp).toLocaleString('en-IN');
        const roleLabel = log.role.toUpperCase();
        
        doc.rect(50, currentY, 495, 24).fill('#F0FDFA');
        doc.fillColor('#047857').font('Helvetica-Bold').text(`✓ Approved by ${log.approver.name} [${roleLabel}]`, 60, currentY + 7);
        doc.font('Helvetica').fillColor('#475569').text(`Date: ${dateStr}`, 320, currentY + 7);
        if (log.remarks) {
          doc.text(`Remarks: "${log.remarks}"`, 50, currentY + 28, { width: 495, italic: true });
          currentY += 15;
        }
        currentY += 32;
      });

      // --- Digital Verification (QR Code Embedding) ---
      const qrBase64 = await generateVerificationQR(odRequest.odCode);
      const qrBuffer = Buffer.from(qrBase64.replace(/^data:image\/png;base64,/, ""), 'base64');
      
      const qrY = 660;
      doc.image(qrBuffer, 435, qrY, { width: 100 });

      doc.fillColor('#0F172A');
      doc.fontSize(9).font('Helvetica-Bold').text('ELECTRONIC VERIFICATION SECURED', 50, qrY + 15);
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text('This letter is digitally signed and officially approved by the college authority.', 50, qrY + 30, { width: 360 });
      doc.text('Scan the QR code to verify the live status of this OD permission in the college database.', 50, qrY + 45, { width: 360 });
      
      // Footer Accent Line
      doc.rect(0, 825, 595.28, 17).fill('#F59E0B'); // Amber footer

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
