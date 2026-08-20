import gplay from 'google-play-scraper';

/**
 * Belirtilen uygulama paket kimliği için Google Play Store'dan yorumları çeker.
 * @param {string} appId - Uygulama paket kimliği (örn: com.mga.lemora)
 * @param {string} developerId - Google Play Console Geliştirici ID
 * @param {object} options - Ek parametreler (sayfa boyutu, sıralama vb.)
 * @returns {Promise<Array>} Formatlanmış yorum listesi
 */
export async function fetchAppReviews(appId, developerId, options = {}) {
  const {
    num = 100,
    sort = gplay.sort.NEWEST,
    lang = 'tr',
    country = 'tr'
  } = options;

  try {
    const result = await gplay.reviews({
      appId,
      sort,
      num,
      lang,
      country
    });

    const reviews = result.data || [];
    const replyUrl = (developerId && developerId !== 'YOUR_PLAY_CONSOLE_DEVELOPER_ID')
      ? `https://play.google.com/console/u/0/developers/${developerId}/app/${appId}/user-feedback/reviews`
      : 'https://play.google.com/console/';

    return reviews.map((review) => ({
      id: review.id,
      app_id: appId,
      user_name: review.userName || 'Anonim',
      score: review.score || 0,
      text: review.text || '',
      review_date: review.date ? new Date(review.date).toISOString() : new Date().toISOString(),
      reply_url: replyUrl
    }));
  } catch (error) {
    console.error(`[Scraper Hata] ${appId} yorumları alınırken hata oluştu:`, error.message);
    throw error;
  }
}
