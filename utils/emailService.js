// utils/emailService.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configurarea Transporter-ului (Folosește EMAIL_USER/PASS din .env)
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,    
        pass: process.env.EMAIL_PASS     
    }
});

// 🚨 Export Implicit (Necesar pentru a se potrivi cu import sendPriceEstimateEmail din controller)
export default async function sendPriceEstimateEmail(toEmail, estimareTotala, detalii, descriere) {
    
    // Formatarea detaliilor (Manoperă/Materiale)
    const detaliiHtml = detalii.map(d => `
        <li>
            <strong>${d.sarcina}</strong>: ${d.total} RON 
            (Manoperă: ${d.manopera} RON, Materiale: ${d.materiale} RON)
        </li>
    `).join('');

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: 'Estimare Renovare - HomeBid',
            html: `
                <h1>Estimare Totală: ${estimareTotala} RON</h1>
                <p>Mulțumim pentru cererea ta: <em>${descriere}</em></p>
                
                <h3>Detalii Defalcare Costuri:</h3>
                <ul>${detaliiHtml}</ul>
                
                <p style="color: gray; font-size: 12px;">Notă: Aceasta este o estimare AI și necesită confirmare finală.</p>
            `
        });

        return true;
    } catch (err) {
        console.error(`❌ Eroare la trimiterea emailului către ${toEmail}:`, err);
        return false;
    }
}