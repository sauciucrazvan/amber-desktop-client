<p align="center">
    <br /><br /><br />
    <section align="center">
      <img src="https://i.imgur.com/aagy1U0.png" width="128" height="128" /><br />
      <b>Amber</b><br />
      WebRTC based communication<br />application, fully open-source.
      <br /><br />
    </section>
    <section align="center">
      <i>more info on the project at</i>
      <br />
      <a href="https://github.com/sauciucrazvan/amber"><b>sauciucrazvan/amber</b></a>
      <br /><br />
    <br /><br /><br />
</p>

## Desktop Auto-Updates

This desktop client uses `electron-updater`.

Packaged builds check GitHub release metadata from `https://github.com/sauciucrazvan/amber-desktop-client/releases/latest/download` by default, so end users do not need to set any environment variables.

- Optional runtime overrides:
  - `AMBER_UPDATER_PROVIDER=generic` + `AMBER_UPDATER_URL=https://your-host/path`
  - `AMBER_UPDATER_PROVIDER=github`
- `GH_TOKEN` is only needed for publishing or for private GitHub releases.
