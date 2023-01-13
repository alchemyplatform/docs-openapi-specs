// light weight SDK around some of Readme's API methods
const axios = require('axios').default;

class Readme {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('No api key provided');
    }

    this._instance = axios.create({
      baseURL: 'https://dash.readme.com/api/v1',
      auth: { username: apiKey },
    });
  }

  static get utils() {
    return {
      createUrlFromSlug: (slug) => {
        if (!slug) {
          throw new Error('No slug provided.');
        }
        const BASE_URL_STAGING =
          'https://alchemyenterprisegroup.readme.io/reference';
        const BASE_URL_PROD = 'https://docs.alchemy.com/reference/';

        // for some reasons - some slugs use _ instead of -
        const fixedSlug = slug.replaceAll(' ', '-').replaceAll('_', '-');
        const url = `${BASE_URL_STAGING}/${fixedSlug}`;
        return url;
      },
    };
  }

  get spec() {
    const baseUrl = '/api-specification';

    return {
      _getMetadata: async ({ page, perPage }) => {
        const response = await this._instance.get(baseUrl, {
          params: {
            perPage,
            page,
          },
        });
        const results = response.data;
        return results;
      },

      find: async ({ id }) => {
        // max page size is 100
        const PAGE_SIZE = 100;

        let found;
        let page = 1;
        while (!found) {
          const results = await this.spec._getMetadata({
            page,
            perPage: PAGE_SIZE,
          });
          console.log(results.length);

          found = results.find((res) => res.id === id);
          page++;

          // if less results returned than page size
          // this is the last page => exit
          if (results.length < PAGE_SIZE) {
            break;
          }
        }
        return found;
      },

      // see https://github.com/axios/axios#-automatic-serialization-to-formdata
      upload: async ({ spec }) => {
        const response = await this._instance.post(
          baseUrl,
          { spec },
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        const { _id, title } = response.data;
        return _id;
      },

      // see https://github.com/axios/axios#-automatic-serialization-to-formdata
      update: async ({ id, spec }) => {
        const url = `${baseUrl}/${id}`;
        try {
          const response = await this._instance.put(
            url,
            { spec },
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          const { _id } = response.data;
          return _id;
        } catch (err) {
          throw new Error(`Error updating - are you sure id ${id} exists?`);
        }
      },
    };
  }
}

module.exports = { Readme };
