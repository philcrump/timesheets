'use strict';

const nodemailer = require("nodemailer");

exports.sendRegisterEmail = async function(target_email, config)
{
  let transporter = nodemailer.createTransport({
    host: config["smtp-host"],
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: config["smtp-user"],
      pass: config["smtp-password"]
    }
  });

  transporter.sendMail({
    from: `"Timesheets" <${config["smtp-from"]}>`,
    to: target_email,
    subject: "Timesheets Registration ✔",
    text: "Welcome to timesheets!",
    html: "<b>Welcome to timesheets!</b>"
  }, function(error) {
    if(error)
    {
      console.log(`Email Error! (registration to: ${target_email})`);
    }
  });
};

exports.sendPasswordResetEmail = async function(target_email, reset_key, config)
{
  let transporter = nodemailer.createTransport({
    host: config["smtp-host"],
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: config["smtp-user"],
      pass: config["smtp-password"]
    }
  });

  transporter.sendMail({
    from: `"Timesheets" <${config["smtp-from"]}>`,
    to: target_email,
    subject: "Timesheets Password Reset",
    text: `You appear to have requested a password reset from timesheets.\n\
            Your reset key is: ${reset_key}\n\
            Please contact your administrator.`,
    html: `You appear to have requested a password reset from timesheets.\n\
            Your reset key is: ${reset_key}\n\
            Please contact your administrator.`
  }, function(error) {
    if(error)
    {
      console.log(`Email Error! (password reset to: ${target_email})`);
    }
  });
};