if (/#(recovery_token|invite_token|confirmation_token|email_change_token)=/.test(location.hash)) location.replace('/admin/' + location.hash);
