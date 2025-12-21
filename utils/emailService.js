    // utils/emailService.js

    import nodemailer from 'nodemailer';
    import dotenv from 'dotenv';
    dotenv.config();

    // Configurarea Transporter-ului (Folosește EMAIL_USER/PASS din .env)
    const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // 🚨 ADAUGĂ ACEASTĂ SECȚIUNE:
    tls: {
        rejectUnauthorized: false
    }
});
    // 🚨 Export Implicit (Necesar pentru a se potrivi cu import sendPriceEstimateEmail din controller)
    export default async function sendPriceEstimateEmail(toEmail, estimareTotala, detalii, descriere,squareMeters,county,materialQuality) {
        
        // Formatarea detaliilor (Manoperă/Materiale)
        const detaliiHtml = detalii.map(d => `
            <tr>
            <td style="padding:10px;border:1px solid #e5e7eb;">${d.sarcina}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;">${d.manopera} RON</td>
            <td style="padding:10px;border:1px solid #e5e7eb;">${d.materiale} RON</td>
            <td style="padding:10px;border:1px solid #e5e7eb;"><strong>${d.total} RON</strong></td>
            </tr>
        `).join('');


        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: toEmail,
                subject: 'Estimare Renovare - HomeBid',
                html: `
                    <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
                    <div style="max-width:700px;margin:auto;background:white;padding:30px;border-radius:8px;">

                        <h1 style="color:#111827;">🏠 HomeBid – Estimare Renovare</h1>

                        <p style="color:#374151;">
                        Am analizat cererea ta și mai jos găsești o estimare orientativă.
                        </p>

                        <h3>📄 Descriere lucrare</h3>
                        <p><em>${descriere}</em></p>

                        <p>
                        <strong>Suprafață:</strong> ${squareMeters} mp<br/>
                        <strong>Județ:</strong> ${county}<br/>
                        <strong>Calitate materiale:</strong> ${materialQuality}
                        </p>

                        <h3>💰 Deviz estimativ</h3>

                        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f3f4f6;">
                            <th style="padding:10px;border:1px solid #e5e7eb;">Lucrare</th>
                            <th style="padding:10px;border:1px solid #e5e7eb;">Manoperă</th>
                            <th style="padding:10px;border:1px solid #e5e7eb;">Materiale</th>
                            <th style="padding:10px;border:1px solid #e5e7eb;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detaliiHtml}
                        </tbody>
                        </table>

                        <h2 style="text-align:right;margin-top:20px;">
                        Total estimat: <span style="color:#16a34a;">${estimareTotala} RON</span>
                        </h2>

                        <p style="font-size:12px;color:#6b7280;">
                        * Aceasta este o estimare orientativă generată automat. Prețul final poate varia
                        în funcție de condițiile reale din teren.
                        </p>

                        <hr/>

                        <p style="text-align:center;font-size:14px;">
                        🔧 Vrei o ofertă finală sau un constructor disponibil?<br/>
                        <strong>Intră în aplicația HomeBid</strong>
                        </p>

                    </div>
                    </div>
                `

            });

            return true;
        } catch (err) {
            console.error(`❌ Eroare la trimiterea emailului către ${toEmail}:`, err);
            return false;
        }
    }