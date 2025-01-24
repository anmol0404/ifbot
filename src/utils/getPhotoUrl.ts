import { delay } from "../extra/delay.js";
import env from "../services/env.js";
import telegram from "../services/telegram.js";

export async function getPhotoUrl(photoId: any): Promise<string> {
  let success = false;
  let photo;

  while (!success) {
    try {
      const result = await telegram.app.telegram.sendPhoto(env.dbPosterID, photoId);
      await delay(1000, 4100);
      photo = `${env.dbPosterLink}/${result.message_id}`;
      success = true;
    } catch (error) {
      success = false;
      if ((error as any).code === 429) {
        console.log(`${error}`);
        await delay(40000, 41000);
      } else {
        console.log(`${error}`);
        await delay(40000, 41000);
      }
    }
  }
  return photo || "";
}
