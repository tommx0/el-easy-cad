import { DATENSCHUTZ_STAND } from './datenschutz-stand'

export function DatenschutzInhaltEn() {
  return (
    <div className="datenschutz-content">
      <p>
        <small>Version: {DATENSCHUTZ_STAND.replace('Fassung', 'revision')}</small>
      </p>

      <h3>1. Controller</h3>
      <p>The developers of el.easy.CAD Community. Please ask questions via the project page.</p>

      <h3>2. Basic principle: no active data collection</h3>
      <p>
        el.easy.CAD is designed as a purely desktop/local tool. There is no central server, no
        hosting and no user account. The controller does not collect, gather or receive any data
        from the use of the application – neither project content nor usage, diagnostic or telemetry
        data. The application contains no analytics, tracking or crash-reporting services, no
        automatic update check, no feedback function and no online licence check. The product
        licence is checked entirely offline using a signed licence file; the end user licence
        agreement no longer requires a connection to a server either (earlier versions of this
        policy described a transfer to the operator’s server at this point – this connection no
        longer exists as of this version).
      </p>
      <p>
        All project data (floor plans, placed components, cables, notes, attached documents) is
        processed and stored exclusively locally on your computer:
      </p>
      <ul>
        <li>
          A local companion server (a background process of the application) manages an SQLite
          database and a store for attached files in a folder in your user directory (default:{' '}
          <code>~/el.easy.CAD Community</code>, containing <code>el-easy-cad.db</code> and the
          subfolder <code>assets</code>). This server can only be reached at <code>127.0.0.1</code>{' '}
          (your own computer) – it cannot be addressed from outside and therefore requires no
          sign-in.
        </li>
        <li>
          Existing projects that have not yet been converted, or the product catalogue, may also be
          held in the local browser storage (IndexedDB) on your computer.
        </li>
        <li>
          A purchased product licence is checked as a signed file entirely offline – without any
          connection to a server.
        </li>
      </ul>
      <p>
        This data never leaves your computer automatically. Whether and which personal data of third
        parties (e.g. names or addresses from a construction project) you enter into your project
        files yourself is entirely your own responsibility as the user – the controller does not
        obtain any knowledge of it and is not a controller within the meaning of the GDPR in this
        respect, as this data does not leave the application.
      </p>
      <p>
        The product catalogue is not loaded from an external (e.g. manufacturer’s) server but is
        held entirely locally in the application or the local database.
      </p>

      <h3>3. Encryption</h3>
      <ul>
        <li>
          The local companion server communicates unencrypted via <code>http://127.0.0.1</code> – as
          this connection never leaves your computer, transport encryption would provide no
          protection here and is deliberately omitted.
        </li>
        <li>
          <strong>Storage:</strong> The local SQLite database containing your project data is not
          stored in encrypted form. The protection of your data therefore corresponds to the general
          protection of your user account or hard disk (operating system access rights and, where
          applicable, disk encryption you have enabled, such as FileVault/BitLocker). Anyone with
          access to your computer or user account also has access to the project data.
        </li>
        <li>End-to-end encryption of your project files is not currently implemented.</li>
      </ul>

      <h3>4. Deletion</h3>
      <p>
        As all data is held exclusively locally, you have full control over its deletion at all
        times:
      </p>
      <ul>
        <li>
          <strong>Deleting a single project:</strong> via the project management of the application
          (Delete project). This removes the associated record and the attached files from the local
          database.
        </li>
        <li>
          <strong>Deleting all application data:</strong> Delete the data folder in your user
          directory (default: <code>~/el.easy.CAD Community</code>, containing the file{' '}
          <code>el-easy-cad.db</code> and the folder <code>assets</code>). This removes all
          projects, documents and the local catalogue collection. This folder is deliberately kept
          when the application is uninstalled so that an update or reinstallation does not lose your
          projects – it must be removed manually for permanent deletion.
        </li>
        <li>
          <strong>Browser data (older/web use):</strong> For projects not yet converted or the
          catalogue in browser storage (IndexedDB), delete the site data for the application in your
          browser settings.
        </li>
      </ul>
      <p>
        As no data is transferred to the controller, no data holdings arise on the controller’s side
        that would have to be deleted.
      </p>

      <h3>5. Your rights</h3>
      <p>
        Insofar as personal data is concerned in an individual case, you have the right under the
        GDPR to access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction of
        processing (Art. 18), data portability (Art. 20) and to object (Art. 21), as well as the
        right to lodge a complaint with a data protection supervisory authority (Art. 77). As the
        controller does not receive any personal data through the use of the application, these
        rights currently have no practical application; for questions, please use the project page.
      </p>
      <p>There is no automated decision-making and no profiling (Art. 22 GDPR).</p>

      <h3>6. Obligation to confirm and changes to this policy</h3>
      <p>
        You must actively agree to this policy before you can use the application: on the very first
        start of the program and again after every change to the content of this policy
        (recognisable by the version date above). Without this confirmation the application cannot
        be used.
      </p>
      <p>
        If a further function is added in future that processes data beyond your own computer (e.g.
        optional synchronisation or collaboration between several users), this policy will be
        extended accordingly before that function is delivered, the date above will be updated, and
        a new confirmation will therefore become due automatically.
      </p>

      <p>
        This policy is also supplied with the application in German as{' '}
        <code>DATENSCHUTZERKLAERUNG.md</code>.
      </p>
    </div>
  )
}
