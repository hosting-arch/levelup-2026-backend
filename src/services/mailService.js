import transporter from '../config/mailer.js';

const getEmailTemplate = (teamName) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Level UP 2026 - Digital Pass</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
        body {
            margin: 0;
            padding: 0;
            min-width: 100%;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #0449AA;
            color: #ffffff;
        }

        .externalClass {
            width: 100%;
        }

        .externalClass,
        .externalClass p,
        .externalClass span,
        .externalClass font,
        .externalClass td,
        .externalClass div {
            line-height: 100%;
        }

        table {
            border-collapse: collapse;
        }

        .pixel-card {
            border: 4px solid #0C0B13;
            border-radius: 20px;
            overflow: hidden;
            background-color: #0C0B13;
        }

        .neon-glow {
            color: #FFF158;
            text-shadow: 0 0 10px rgba(255, 241, 88, 0.4);
        }

        .accent-blue {
            color: #9DD6FF;
        }

        .btn {
            background-color: #FFF158;
            color: #0C0B13;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 900;
            border: 4px solid #0C0B13;
            box-shadow: 6px 6px 0px #0449AA;
            display: inline-block;
            font-size: 14px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
    </style>
</head>

<body style="margin: 0; padding: 0; background-color: #0449AA;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 60px 0 80px 0;">

                <!-- Main Pass Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="pixel-card"
                    style="box-shadow: 0 30px 60px rgba(4, 73, 170, 0.5); border: 4px solid #0C0B13;">

                    <!-- Decorative HUD Corners (Yellow) -->
                    <tr>
                        <td style="padding: 40px 40px 0 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="30" style="border-top: 4px solid #FFF158; border-left: 4px solid #FFF158; height: 30px;"></td>
                                    <td></td>
                                    <td width="30" style="border-top: 4px solid #FFF158; border-right: 4px solid #FFF158; height: 30px;"></td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 10px 40px 30px 40px; border-bottom: 4px dashed #1C1D31;">
                            <h1 style="margin: 0; font-size: 38px; letter-spacing: 5px; color: #FFF158; text-transform: uppercase; font-weight: 900; text-shadow: 4px 4px 0px #0449AA;">
                                LEVEL UP 2026</h1>
                            <div style="font-size: 10px; color: #9DD6FF; letter-spacing: 4px; margin-top: 15px; font-weight: 800; text-transform: uppercase;">READY_FOR_NEXT_LEVEL</div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 45px 50px 20px 50px;">
                            <p style="font-size: 22px; color: #ffffff; margin-bottom: 30px; font-weight: bold;">
                                Salut, <span style="color: #FFF158;">Echipa ${teamName}</span>!
                            </p>
                            <p style="font-size: 15px; line-height: 1.8; color: #aaaaaa; margin-bottom: 45px;">
                                Suntem entuziasmați să confirmăm participarea voastră la cea mai intensă competiție
                                digitală a anului. Inscrierea a fost procesată cu succes în baza noastră de date.
                            </p>

                            <!-- Data Grid (HUD Module Style) -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%"
                                style="background-color: #1C1D31; border: 4px solid #0449AA; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td width="50%" style="padding: 25px; border-right: 2px solid #0449AA; border-bottom: 2px solid #0449AA;">
                                        <div style="font-size: 10px; color: #9DD6FF; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; font-weight: 800;">DATA ACCES</div>
                                        <div style="font-size: 18px; font-weight: bold; color: #FFF158;">9 MAI 2026</div>
                                    </td>
                                    <td width="50%" style="padding: 25px; border-bottom: 2px solid #0449AA;">
                                        <div style="font-size: 10px; color: #9DD6FF; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; font-weight: 800;">LOCAȚIE</div>
                                        <div style="font-size: 18px; font-weight: bold; color: #FFF158;">FIIR, UPB</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="padding: 20px; background-color: #0C0B13; text-align: center;">
                                        <div style="font-size: 9px; color: #FFF158; letter-spacing: 3px; font-weight: bold;">STATUS: SYSTEM_STABLE // READY</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td align="center" style="padding: 45px 0 20px 0;">
                            <a href="${process.env.SITE_URL || 'https://levelup.osfiir.ro'}/regulament" class="btn">DESCARCĂ REGULAMENTUL</a>
                        </td>
                    </tr>

                    <!-- Footer Decorative -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="30" style="border-bottom: 4px solid #FFF158; border-left: 4px solid #FFF158; height: 30px;"></td>
                                    <td></td>
                                    <td width="30" style="border-bottom: 4px solid #FFF158; border-right: 4px solid #FFF158; height: 30px;"></td>
                                </tr>
                                <tr>
                                    <td colspan="3" align="center" style="padding-top: 40px;">
                                        <p style="font-size: 13px; color: #666; margin: 0; letter-spacing: 1px; font-weight: bold;">Organizat de <span style="color: #FFF158;">OSFIIR</span> cu ❤️</p>
                                        <p style="font-size: 10px; color: #444; margin-top: 20px; text-transform: uppercase; letter-spacing: 1px;">Acesta este un mesaj automat. Te rugăm să nu răspunzi direct la acest email.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 40px; font-size: 12px; color: #FFF158; font-weight: bold; opacity: 0.8; letter-spacing: 1px;">
                    &copy; 2026 Level UP | HIGH PERFORMANCE ACCESS
                </div>

            </td>
        </tr>
    </table>
</body>

</html>
`;

export const sendConfirmationEmail = async (toEmail, teamName) => {
    const mailOptions = {
        from: `"Level UP 2026" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Confirmare Inscriere Level UP 2026 - Echipa ${teamName}`,
        html: getEmailTemplate(teamName)
    };

    return await transporter.sendMail(mailOptions);
};
