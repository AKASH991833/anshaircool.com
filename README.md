# Ansh Air Cool

The customer site at https://anshaircool.netlify.app/ is a static site deployed from this repository. The public copy in `content/site.json` is editable through `/admin/` when Netlify Identity and Git Gateway have been set up for this project. Editing saves a Git commit, then Netlify redeploys it for every visitor. Visitors never receive an admin password; the retired hardcoded-password panel and unused Flask/backend files were removed.

## Setup and safeguards

1. In Netlify for the `anshaircool` project, enable Identity. In Identity settings, turn off open registration (invite-only), invite only the authorized editor, and enable Git Gateway. Grant Git Gateway access only to this project's repository. Git Gateway is deprecated by Netlify; it currently receives major security fixes but is not recommended for new configurations. Plan to migrate to a supported Git-backed editor or a maintained API-auth service instead of relying on it permanently. **Do not describe any admin system as unhackable.**
2. Confirm that the editor can log in, change `content/site.json`, publish, and see the change on a separate browser. Until then, the admin is **not operational**. GitHub repository editors also have full publishing authority.
3. Netlify Forms detection is enabled in the current `anshaircool` project. The HTML form uses `data-netlify="true"` and posts URL-encoded data. After deployment, submit a test enquiry and verify that it appears in Netlify Forms. Configure an email notification to a verified business recipient in Netlify's Forms settings. If the endpoint fails, the form reports failure and does not silently save it to localStorage.
4. Phone, address, social accounts, pricing, ratings, testimonials and job photos are omitted until the owner confirms real details. Do not publish sample details as fact. Confirm service descriptions before using this for real customers.

The old Git history still contains the default `admin/admin123` credential and public placeholder content; it no longer unlocks an active panel. Rotate any real reused passwords. This repository and the deployed site are public. Admin login is an authentication control, not content secrecy: all published content JSON is public.

To preview locally, run `python3 -m http.server 8000` from the root. Local form posts require Netlify to work; test the actual deployed form and verify its receipt in the dashboard. Check at 390px and desktop widths before publishing.
