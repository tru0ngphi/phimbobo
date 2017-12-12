// document['domain'] + '4590481877' + _0x55bax2b
'use strict'

const qs = require('querystring')
const aes = require('../aes')
const got = require('got')
const parse = require('fast-json-parse')
const cheerio = require('cheerio')
const DOMAIN = 'https://phimbathu.com/'
const provider = 'PBH'

const gotOptions = {
  headers: {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2977.0 Safari/537.36',
    referer: `${DOMAIN}`
  },
  timeout: 3000,
  retries: 0
}

exports.search = dork => {
  const q = qs.escape(dork)
  return got(`${DOMAIN}/tim-kiem.html?q=${q}`)
    .then(response => cheerio.load(response.body))
    .then($ =>
      $('.list-films')
        .find('.item ')
        .map((idx, elem) => {
          const id = $(elem)
            .find('a')
            .attr('href')
            .replace('.html', '')
            .split('-')
            .slice(-1)
            .pop()
          const url = $(elem)
            .find('a')
            .attr('href')
            .replace('/', 'xem-phim/phim-')
          const title = $(elem)
            .find('a')
            .attr('title')
          const thumb = $(elem)
            .find('img')
            .attr('data-original')
          return {
            provider,
            id,
            title,
            url,
            thumb
          }
        })
        .get()
    )
}

// /xem-phim/phim-gai-goi-berlin-3224.html
exports.findMedias = url => {
 if (url.indexOf('/phim') !== -1) {
    url = url.replace('.html', '')
  }
  return got(`${DOMAIN}${url}`, gotOptions)
    .then(reponse => extractMedia(reponse.body))
    .then(playerSetting =>
      playerSetting.sourceLinks
        .map(sourceLink => sourceLink.links)
        .concatAll()
        .map(video => ({
          provider,
          id: playerSetting.modelId,
          title: playerSetting.title,
          thumb: playerSetting.poster,
          url: decodeUrl(
            video.file,
            'phimbathu.com' + '4590481877' + playerSetting.modelId
          ),
          resolution: parseFloat(video.label),
          label: video.label,
          episodes: playerSetting.episodes
        }))
    )
}

function extractMedia(body) {
  const beginSlice = body.indexOf('var playerSetting = {') + 20
  const endSlice = body.indexOf('"};') + 2
  const result = parse(body.slice(beginSlice, endSlice).trim())

let ret = {};

  if (result.err) {
 
ret = {
      sources: []
    };
  }
ret = result.value;

  // parse episodes
  let $ = cheerio.load(body);

  ret.episodes = [];
  $('.list-episode')
    .find('a')
   .map((idx, elem) => {
     let url = $(elem).attr('href').replace(DOMAIN, '');

      ret.episodes.push({
        no: $(elem).text(),
        hash: new Buffer(
         aes.enc(provider + '|' + url, process.env.SECRET)
        ).toString('base64')
      });
    });

  return ret;
}

// decode url using the password
const decodeUrl = (url, password) => {
  return aes.dec(url, password)
}
