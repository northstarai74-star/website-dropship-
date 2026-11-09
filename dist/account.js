(() => {
  'use strict';

  const form = document.querySelector('#auth-form');
  const status = document.querySelector('#auth-status');
  const sessionStatus = document.querySelector('#session-status');
  const title = document.querySelector('#auth-title');
  const description = document.querySelector('#auth-description');
  const submit = document.querySelector('#auth-submit');
  const emailInput = document.querySelector('#auth-email');
  const passwordInput = document.querySelector('#auth-password');
  const confirmInput = document.querySelector('#auth-confirm');
  const confirmField = document.querySelector('.confirm-field');
  const forgotButton = document.querySelector('#forgot-password');
  const signedInPanel = document.querySelector('#signed-in-panel');
  const signedInEmail = document.querySelector('#signed-in-email');
  const tabs = [...document.querySelectorAll('[data-auth-mode]')];
  const togglePassword = document.querySelector('#toggle-password');
  let mode = new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'signin';
  let busy = false;
  const config = window.NEEDVERSE_SUPABASE;
  const client = window.supabase?.createClient && config?.url && config?.anonKey
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  const say = (node, message, kind = '') => {
    node.textContent = message;
    node.classList.toggle('is-error', kind === 'error');
    node.classList.toggle('is-success', kind === 'success');
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    const creating = mode === 'signup';
    const resetting = mode === 'reset';
    title.textContent = resetting ? 'Choose a new password.' : creating ? 'Create your account.' : 'Welcome back.';
    description.textContent = resetting ? 'Choose a new password for your Needverse account.' : creating ? 'A little closer to your everyday essentials.' : 'Sign in to continue to your account.';
    confirmField.hidden = !(creating || resetting);
    confirmInput.required = creating || resetting;
    passwordInput.autocomplete = creating || resetting ? 'new-password' : 'current-password';
    forgotButton.hidden = creating || resetting;
    document.querySelector('.auth-tabs').hidden = resetting;
    submit.innerHTML = resetting ? 'Update password <span aria-hidden="true">&#8599;</span>' : creating ? 'Create account <span aria-hidden="true">&#8599;</span>' : 'Sign in <span aria-hidden="true">&#8599;</span>';
    tabs.forEach((tab) => {
      const active = tab.dataset.authMode === mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    say(status, '');
  };

  const showSignedIn = (user) => {
    form.hidden = true;
    document.querySelector('.auth-tabs').hidden = true;
    document.querySelector('.auth-card-heading').hidden = true;
    signedInPanel.hidden = false;
    signedInEmail.textContent = user?.email || 'Your Needverse account';
  };

  const showSignIn = () => {
    signedInPanel.hidden = true;
    form.hidden = false;
    document.querySelector('.auth-tabs').hidden = false;
    document.querySelector('.auth-card-heading').hidden = false;
    setMode('signin');
  };

  const friendlyError = (error) => {
    const message = String(error?.message || 'Something went wrong. Please try again.');
    if (/invalid login credentials/i.test(message)) return 'That email and password combination did not match. Try again.';
    if (/email not confirmed/i.test(message)) return 'Please confirm your email from the link we sent, then sign in.';
    if (/password should be at least/i.test(message)) return 'Choose a longer password and try again.';
    if (/rate limit|too many requests/i.test(message)) return 'Too many attempts. Wait a moment and try again.';
    if (/redirect.*allow|not allowed/i.test(message)) return 'Add this page to the allowed redirect URLs in Supabase Auth settings.';
    return message;
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.authMode)));
  togglePassword.addEventListener('click', () => {
    const reveal = passwordInput.type === 'password';
    passwordInput.type = reveal ? 'text' : 'password';
    togglePassword.textContent = reveal ? 'Hide' : 'Show';
    togglePassword.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    togglePassword.setAttribute('aria-pressed', String(reveal));
  });

  if (!client) {
    say(status, 'Account sign-in is unavailable: Supabase settings did not load.', 'error');
    submit.disabled = true;
  } else {
    client.auth.getSession().then(({ data, error }) => {
      if (error) say(status, friendlyError(error), 'error');
      if (data?.session?.user && mode !== 'reset') showSignedIn(data.session.user);
    });
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        form.hidden = false;
        signedInPanel.hidden = true;
        setMode('reset');
        say(status, 'Choose a new password for your account.');
      } else if (session?.user && mode !== 'reset') showSignedIn(session.user);
      else if (event === 'SIGNED_OUT') showSignIn();
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client || busy) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) { say(status, 'Enter your email and password to continue.', 'error'); return; }
    if ((mode === 'signup' || mode === 'reset') && password !== confirmInput.value) { say(status, 'Those passwords do not match.', 'error'); confirmInput.focus(); return; }

    busy = true;
    submit.disabled = true;
    say(status, mode === 'signup' ? 'Creating your account…' : 'Signing you in…');
    try {
      if (mode === 'signup') {
        const redirectTo = new URL('./account.html', location.href).href;
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo }
        });
        if (error) throw error;
        if (data.session?.user) showSignedIn(data.session.user);
        else say(status, 'Check your inbox for a confirmation link to finish creating your account.', 'success');
      } else if (mode === 'reset') {
        const { data, error } = await client.auth.updateUser({ password });
        if (error) throw error;
        showSignedIn(data.user);
        say(sessionStatus, 'Your password has been updated.', 'success');
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) showSignedIn(data.user);
      }
    } catch (error) {
      say(status, friendlyError(error), 'error');
    } finally {
      busy = false;
      submit.disabled = false;
    }
  });

  forgotButton.addEventListener('click', async () => {
    if (!client) return;
    const email = emailInput.value.trim();
    if (!email) { say(status, 'Enter your email address first, then request a reset link.', 'error'); emailInput.focus(); return; }
    forgotButton.disabled = true;
    say(status, 'Sending password reset link…');
    try {
      const redirectTo = new URL('./account.html?mode=reset', location.href).href;
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      say(status, 'If an account exists for that email, a password reset link is on its way.', 'success');
    } catch (error) {
      say(status, friendlyError(error), 'error');
    } finally {
      forgotButton.disabled = false;
    }
  });

  document.querySelector('#sign-out').addEventListener('click', async () => {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) say(sessionStatus, friendlyError(error), 'error');
    else say(sessionStatus, 'You are signed out.', 'success');
  });

  setMode(mode);
})();
