/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable require-jsdoc */

// This is all of the Penumbra-relevant code:
const onReady = async (
  { detail: { penumbra } } = {
    detail: self,
  },
) => {
  // Download and decrypt and display in table
  // TODO: fix demo table cell association
  penumbra
    .get(...window.files)
    .then((pfiles) => penumbra.getTextOrURI(pfiles))
    // .then(insertIntoCell);
    .then(window.insertIntoCell);

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
          cell2.innerText = `${contentLength / 1000}KB`;
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
