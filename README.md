# BatteryEvidence public recovery

This is a static emergency recovery site for `batteryevidence.eu`.

## What it does

- Provides the public BatteryDocs marketing and scope-check pages in English, Polish and German.
- Provides a privacy and imprint page.
- Opens a pre-addressed email draft to `office@yfgglobal.com` when a visitor completes the fit-check form.

## What it deliberately does not do

- It does not store, transmit or process contact-form data.
- It does not include a database, payment processing, Stripe, client documents, authentication, file uploads or an owner portal.
- It must not be used for confidential document intake.

## Deploy

Railway is configured through `railway.toml` to run a static Vite build with `serve`.

Before connecting the production domain, verify the Railway-generated URL, homepage, `/pl`, `/de`, `/privacy` and the email-draft flow.
