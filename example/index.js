// This is all of the Penumbra-relevant code:
const onReady = async (
  { detail: { penumbra } } = {
    detail: self,
  },
) => {
  // Wait for files to be loaded
  await new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.files.length > 0) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });

  // eslint-disable-next-line no-console
  console.log(`Fetching ${window.files.length} files...`);

  // Download and decrypt and display in table
  // TODO: fix demo table cell association
  try {
    penumbra
      .get(...window.files)
      .then((pfiles) => penumbra.getTextOrURI(pfiles))
      .then(window.insertIntoCell);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('An error occurred while running penumbra.get()', err);
  }

  const runOnce = {};
  // Display download progress
  window.addEventListener(
    'penumbra-progress',
    ({ detail: { percent, id, contentLength } }) => {
      const i = window.files.findIndex(
        (elt) => 'url' in elt && typeof id !== 'undefined' && elt.url === id,
      );
      if (i !== -1) {
        const cell = document.getElementById(`${i}-progress`);
        cell.innerText = `${percent}%`;

        if (!runOnce[i]) {
          const cell2 = document.getElementById(`${i}-size`);
          cell2.innerText = `${(contentLength / 1000).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 2,
            },
          )}KB`;
          runOnce[i] = true;
        }
      }
    },
  );

  // Function to download and zip
  // const downloadManyFiles = () =>
  //   penumbra.get(...window.files).then((pfiles) => penumbra.save(pfiles));
};

if (!self.penumbra) {
  self.addEventListener('penumbra-ready', onReady);
} else {
  onReady();
}
