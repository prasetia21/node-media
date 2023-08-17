const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');
const base64Img = require('base64-img');
const fs = require('fs');

const { Media } = require('../models');

router.get('/', async(req, res) => {
  const media = await Media.findAll({ attributes: ['id', 'image']});

  // menampilkan url hostname + directory image di hasil api get
  const mappedMedia = media.map((m) => {
    m.image = `${req.get('host')}/${m.image}`;
    return m;
  });

  return res.json({
    status: 'success', 
    data: mappedMedia,
  });
});

router.post('/', (req, res) => {
  const image = req.body.image;

  // check file base64 atau bukan
  if (!isBase64(image, {mimeRequired: true})) {
    return res.status(400).json({ status: 'error', message: 'invalid Base64'}); 
  }

  // tes respon di postman
  // return res.send('ok');

  // upload file
  base64Img.img(image, './public/images', Date.now(), async(err, filepath) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message }); 
    }

    // split posisi path dan ambil file name image
    const filename = filepath.split('/').pop();

    // simpan ke model media
    const media = await Media.create({ image: `images/${filename}`});

    // respon bila sukses dan tersimpan
    return res.json({
      status: 'success', 
      data: {
        id: media.id,
        // akan menyimpan data berdasar host, misal localhost:8080
        image: `${req.get('host')}/images/${filename}`
      }
    })
  })

});

router.delete('/:id', async(req, res) => {
  const id = req.params.id;

  const media = await Media.findByPk(id);

  if (!media) {
    return res.status(404).json({ status: 'error', message: 'media not found' }); 
  }

  fs.unlink(`./public/${media.image}`, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message }); 
    }

    await media.destroy();

    return res.json({
      status: 'success', 
      message: 'image deleted'
    });
  });
});

module.exports = router;
