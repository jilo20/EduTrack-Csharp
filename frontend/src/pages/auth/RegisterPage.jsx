/*
 * ==========================================================================
 * FILE:    src/pages/auth/RegisterPage.jsx
 * OWNER:   Abaquita, Kea
 * WBS:     4.7 Register Page
 * PURPOSE: Two steps: verify the invite ID, then fill in the account details.
 *
 * API:  verifyId(idNumber), register(data) from src/api/auth.js
 * TODO: Step 1 - enter the invite ID and verify it (show the role it is for).
 *       Step 2 - first name, last name, email, password, confirm password (must match, min 8 characters).
 * MUI:  Stepper, TextField, Button, Alert
 *
 * RULE:    Material UI components only. See frontend/README.md.
 * STATUS:  EMPTY - not started. Delete this line when you begin.
 * ==========================================================================
 */

import PagePlaceholder from '../../components/common/PagePlaceholder';

export default function RegisterPage() {
  return <PagePlaceholder title="Register" owner="Abaquita, Kea" file="src/pages/auth/RegisterPage.jsx" />;
}
