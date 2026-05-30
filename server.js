const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Resend } = require("resend");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// API
app.post("/send-email", async (req, res) => {
  try {
    const { email } = req.body;

    const response = await resend.emails.send({
      from: "onboarding@resend.dev",

      to: "nikhilkandhare22@gmail.com",

      subject: "Welcome to Our Platform 🎉",

      html: `
          <div style="font-family:sans-serif;padding:20px">
            <h1>Welcome 🎉</h1>

            <p>
              Your account has been created successfully.
            </p>

            <p>
              Email:
              <strong>${email}</strong>
            </p>

            <p>
              Thanks for joining us 🚀
            </p>
          </div>
          `,
    });

    res.status(200).json({
      success: true,
      message: "Email Sent Successfully",
      data: response,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
