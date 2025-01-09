import { instagramSessionService } from "./instagramSessionService";
import { userInstagramService } from "./userInstagramService";
import { IgApiClient, IgCheckpointError } from "instagram-private-api";

interface userLogin {
    name: string
    username: string
    password: string
    status: string
}


interface MediaItem {
    mediaType: string;
    url: string;
}

interface Feed {
    id: string;
    mediaItems: MediaItem[];
    mediaType: number;
    caption: string;
    likeCount: number;
    commentCount: number;
    username: string
    takenAt: Date;
}

interface dataLogin {
    id: number
    username: string
    password: string
}

interface search {
    defaultAccount: string
    query: string
}

interface dataHastags {
    query: string;
    username: string;
    nextMaxId?: string;
}

interface dataAccount {
    pk: string | number;
    username: string;
    nextMaxId?: string;
}

interface dataFeedsByLocation {
    locationId: string | number;
    username: string;
    nextMaxId?: string;
}

const extractMediaItems = (media: any): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    if (media.media_type === 1) {
        // Foto tunggal
        mediaItems.push({
            mediaType: 'photo',
            url: media.image_versions2?.candidates[0]?.url || '',
        });
    } else if (media.media_type === 2) {
        // Video tunggal
        mediaItems.push({
            mediaType: 'video',
            url: media.video_versions[0]?.url || '',
        });
    } else if (media.media_type === 8) {
        // Carousel (slide)
        for (const carouselItem of media.carousel_media) {
            if (carouselItem.media_type === 1) {
                mediaItems.push({
                    mediaType: 'photo',
                    url: carouselItem.image_versions2?.candidates[0]?.url || '',
                });
            } else if (carouselItem.media_type === 2) {
                mediaItems.push({
                    mediaType: 'video',
                    url: carouselItem.video_versions[0]?.url || '',
                });
            }
        }
    }
    return mediaItems;
};

const mapPosts = async (posts: any[]): Promise<Feed[]> => {
    const mappedPosts: Feed[] = [];
    for (const post of posts) {
        if (!post || !post.id) continue;
        mappedPosts.push({
            id: post.id,
            mediaItems: extractMediaItems(post),
            mediaType: post.media_type,
            caption: post.caption?.text || '',
            likeCount: post.like_count || 0,
            commentCount: post.comment_count || 0,
            username: post?.user?.username || 'uknown',
            takenAt: new Date(post.taken_at * 1000),
        });
    }
    return mappedPosts;
};
//fungsi handleLogin adalah untuk meneruskan dataLogin ke file userInstagramService pada fungsi create
const handleLogin = async (dataLogin: userLogin) => {
    const resLogin = await userInstagramService.create(dataLogin)
    return resLogin
}
//fungi getAllUsers hanya untuk megambil semua data pada file userInstagramService pada fungsi findAll
const getAllUsers = async () => {
    const resAllUsers = await userInstagramService.findAll()
    return resAllUsers
}
//fungsi loginPrivate untuk login ke instagram langsung menggunakan repository instagram private api 
const loginPrivate = async (userLogin: dataLogin) => {
    const userIgId = userLogin.id
    const ig = new IgApiClient()
    ig.state.generateDevice(userLogin.username)

    await ig.account.login(userLogin.username, userLogin.password)
    const serialized = await ig.state.serialize()
    const cookieJar = await ig.state.serializeCookieJar()
    const serializedCookieJar = JSON.stringify(cookieJar)
    const data = {
        userId: userIgId,
        session: JSON.stringify(serialized),
        cookieJar: serializedCookieJar
    }

    //diberikan kondisi apabila terdapat isi dari data ada pada di database maka hanya di update dan jika tidak maka buat baru 
    const checkUsersSession = await instagramSessionService.findByUserId(userIgId)
    if (checkUsersSession) {
        const resSessionIg = await instagramSessionService.update(userIgId, data)
    } else {
        //setelah mendapatkan serialzed dan cookieJar dari login tersebut kemudian dikirim ke file instagramSessionService pada fungsi icreate
        const createSession = await instagramSessionService.create(data)
    }
    const statusUpdate = await userInstagramService.updateStatus(userIgId, 'login')
    console.log(statusUpdate)
    return ({ success: true })
}
//fitur logout 
const logoutUsers = async (id: number) => {
    const logoutUsers = await userInstagramService.updateStatus(id, 'logout')
    console.log(logoutUsers)
    return ({ success: true })
}

const deleteUsers = async (id: number) => {
    const resDeleteUsers = await userInstagramService.delete(id)
    return ({ success: true })
}
//const sleep hanya untuk delay custom
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
//fungsi search ini untuk riset berdasarkan keyword outputnya adalah hastags, account dan lokasi
const search = async (dataSearch: search) => {
    const ig = new IgApiClient()
    //ngambil semua data kemudian di cocokkan dengan username yang dikirim dari front end
    const searchAll = await userInstagramService.findAll()
    const matched = searchAll.find(users => users.name === dataSearch.defaultAccount)
    //jika data cocok maka eksekusi ini
    if (matched && matched.session) {
        try {
            //kemudian ambil session dan cokieJar 
            //note session = serialize, session disini adalah penamaan pada column database
            //deserialize sama deserializeCookieJar kurang paham intinya ketika sereliaze dan cokieJar mau digunakan untuk suatu fitur butuh di deserialize sama deserializeCookieJar
            await ig.state.deserialize(JSON.parse(matched.session?.session))
            await ig.state.deserializeCookieJar(JSON.parse(matched.session?.cookieJar))

            const query = dataSearch.query

            // Tambahkan delay antara requests
            const searchWithRetry = async (searchFn: () => Promise<any>) => {
                try {
                    await sleep(2000); // delay 2 detik
                    return await searchFn();
                } catch (error: any) {
                    if (error instanceof IgCheckpointError) {
                        return { status: 500, error: 'Account anda terkena challenge' };
                    }
                    if (error.name === 'IgActionSpamError') {
                        return { status: 500, error: 'Action blocked due to spam' };
                    }
                    if (error.name === 'IgNetworkError') {
                        await sleep(5000); // tunggu lebih lama jika network error
                        return await searchFn(); // retry once
                    }
                    return { error: error.error };
                }
            };
            //dibawah ini fungsi untuk mencari berdasarkan keyword
            const [usersResult, hashtagsResult, locationsResult] = await Promise.all([
                searchWithRetry(() => ig.search.users(query)),
                searchWithRetry(() => ig.search.tags(query)),
                searchWithRetry(() => ig.search.location(0, 0, query)),
            ]);

            // Check jika terdapat error
            const errors = [];
            if (usersResult.error) errors.push(`Users: ${usersResult.error}`);
            if (hashtagsResult.error) errors.push(`Hashtags: ${hashtagsResult.error}`);
            if (locationsResult.error) errors.push(`Locations: ${locationsResult.error}`);

            //apabila terdapat salah satu entah itu hastags, account atau lokasi maka akan mengembalikan array kosong
            if (errors.length > 0) {
                return {
                    success: 400,
                    errors: errors,
                    data: {
                        users: usersResult.error ? [] : usersResult,
                        hashtags: hashtagsResult.error ? [] : hashtagsResult,
                        locations: locationsResult.error ? [] : locationsResult,
                    }
                };
            }
            //note apabila berhasil dan hasil hanya menampilkan salah satu dari tiga maka kemungkinan akun terkena challenge atau session pada database expired
            return {
                success: true,
                data: {
                    locations: locationsResult,
                    hashtags: hashtagsResult,
                    users: usersResult,
                },
            }
            //handle apabila belum milih default account
        } catch (error: any) {
            console.error('Search error:', error);
            return {
                success: 400,
                error: 'Search failed. Please check default account and try again',
            };
        }
    }
    //handle apabila tidak ditemukan user session 
    return {
        success: 500,
        error: 'User session not found'
    };
}
//fitur riset hastags
const getFeedsByHastag = async (dataHastags: dataHastags) => {
    const ig = new IgApiClient();
    //ngambil semua data kemudian di cocokkan dengan username yang dikirim dari front end
    const searchAll = await userInstagramService.findAll();
    const matched = searchAll.find(users => users.name === dataHastags.username);
    console.log('ini adalah user', matched)
    //jika data cocok maka eksekusi ini
    if (matched && matched.session) {
        try {
            //kemudian ambil session dan cokieJar 
            //note session = serialize, session disini adalah penamaan pada column database
            //deserialize sama deserializeCookieJar kurang paham intinya ketika sereliaze dan cokieJar mau digunakan untuk suatu fitur butuh di deserialize sama deserializeCookieJar
            await ig.state.deserialize(JSON.parse(matched.session?.session));
            await ig.state.deserializeCookieJar(JSON.parse(matched.session?.cookieJar));

            // menambahkan retry mesin untuk error handling
            const getFeedsWithRetry = async () => {
                try {
                    //mencari postingan berdasarkan query
                    await sleep(1000); // delay 2 seconds
                    const feeds = ig.feed.tags(dataHastags.query);
                    //kalo ga salah ini buat check apakah dataHastags terdapat nextMaxId jika ada maka berikan nextMaxId yang berasal dari feeds 
                    if (dataHastags.nextMaxId) {
                        feeds['nextMaxId'] = dataHastags.nextMaxId;
                    }

                    const response = await feeds.request();
                    console.log('success get hastags', response);
                    return response;
                } catch (error: any) {
                    //apabila terdapat error 
                    console.log('ini error ', error);
                    if (error instanceof IgCheckpointError) {
                        console.log('Account anda terkena challenge');
                        return { status: 500, error: 'Account anda terkena challenge' };
                    }
                    if (error.name === 'IgActionSpamError') {
                        console.log('Action blocked terdeteksi spam');
                        return { status: 500, error: 'Action blocked due to spam' };
                    }
                    if (error.name === 'IgNetworkError') {
                        console.log('problem with network');

                        await sleep(5000); // wait longer for network error
                        const feeds = ig.feed.tags(dataHastags.query);
                        if (dataHastags.nextMaxId) {
                            feeds['nextMaxId'] = dataHastags.nextMaxId;
                        }
                        return await feeds.request(); // retry once
                    }
                    return { error: error.error };
                }
            };

            const response = await getFeedsWithRetry();

            // Check if there was an error
            if ('error' in response) {
                console.log('ini error kedua ', response.error);
                return {
                    success: 500,
                    error: 'Terjadi kesalahan saat Scrapping, Pastikan internet anda dalam keadan baik dan Silahkan coba lagi'
                };
            }

            const sections = response.sections || [];
            const nextPageMaxId = response.next_max_id || null;
            //const posts gunanya untuk mengatur tata letak agar mudah di filter dan dipilih yang penting saja
            const posts = sections.flatMap((section) => {
                if (section.layout_content?.medias) {
                    return section.layout_content.medias.map(
                        (media) => media.media
                    );
                }
                return [];
            });
            //kemudian hasil dari post di atur agar sesuai menggunakan fungsi mapPosts
            const mappedFeeds = await mapPosts(posts);
            //kirim hasil dari mappedFeeds ke front end dan nextMaxId untuk fitur load more
            return {
                success: 200,
                data: {
                    feeds: mappedFeeds,
                    nextMaxId: nextPageMaxId
                }
            };
        } catch (error) {
            console.error('Error in getFeedsByHastag:', error);
            return {
                status: 400,
                error: 'Search failed. Please try again.'
            };
        }
    }
    return { status: 500, error: 'User session not found' };
};
//fitur riset Account
const getFeedsByUsername = async (dataAccount: dataAccount) => {
    const ig = new IgApiClient();
    //ngambil semua data kemudian di cocokkan dengan username yang dikirim dari front end
    const searchAll = await userInstagramService.findAll();
    const matched = searchAll.find(users => users.name === dataAccount.username);
    //jika data cocok maka eksekusi ini
    if (matched && matched.session) {
        try {
            //kemudian ambil session dan cokieJar 
            //note session = serialize, session disini adalah penamaan pada column database
            //deserialize sama deserializeCookieJar kurang paham intinya ketika sereliaze dan cokieJar mau digunakan untuk suatu fitur butuh di deserialize sama deserializeCookieJar
            await ig.state.deserialize(JSON.parse(matched.session?.session));
            await ig.state.deserializeCookieJar(JSON.parse(matched.session?.cookieJar));

            // menambahkan retry mesin untuk error handling
            const getFeedsWithRetry = async () => {
                try {
                    await sleep(2000); // delay 2 seconds
                    const feeds = ig.feed.user(dataAccount.pk);
                    //kalo ga salah ini buat check apakah dataHastags terdapat nextMaxId jika ada maka berikan nextMaxId yang berasal dari feeds 
                    if (dataAccount.nextMaxId) {
                        feeds['nextMaxId'] = dataAccount.nextMaxId;
                    }

                    return await feeds.request();
                } catch (error: any) {
                    //apabila terdapat error 
                    if (error instanceof IgCheckpointError) {
                        return { status: 500, error: 'Account anda terkena challenge' };
                    }
                    if (error.name === 'IgActionSpamError') {
                        return { status: 500, error: 'Account terkena spam' };
                    }
                    if (error.name === 'IgNetworkError') {
                        await sleep(5000); // wait longer for network error
                        const feeds = ig.feed.user(dataAccount.pk);
                        if (dataAccount.nextMaxId) {
                            feeds['nextMaxId'] = dataAccount.nextMaxId;
                        }
                        return await feeds.request(); // retry once
                    }
                    return { error: error.error };
                }
            };

            const response = await getFeedsWithRetry();

            // Check if there was an error
            if ('error' in response) {
                return {
                    success: 400,
                    error: 'Terjadi kesalahan saat Scrapping, Pastikan internet anda dalam keadaan baik dan Silahkan coba lagi'
                };
            }
            const sections = response.items;
            const nextPageMaxId = response.next_max_id;
            //yang ini tidak perlu const posts langsung atur menggunakan fungsi mapPosts
            const mappedFeeds = await mapPosts(sections);
            //kirim hasil dari mappedFeeds ke front end dan nextMaxId untuk fitur load more
            return {
                success: true,
                data: {
                    feeds: mappedFeeds,
                    nextMaxId: nextPageMaxId
                }
            };
        } catch (error) {
            return {
                success: 500,
                error: 'Search Failed. Please try again'
            };
        }
    }
    return {
        success: 500,
        error: 'User session not found'
    };
};

const getFeedsByLocation = async (dataLocation: dataFeedsByLocation) => {
    const ig = new IgApiClient();
    //ngambil semua data kemudian di cocokkan dengan username yang dikirim dari front end
    const searchAll = await userInstagramService.findAll();
    const matched = searchAll.find(users => users.name === dataLocation.username);
    //jika data cocok maka eksekusi ini
    if (matched && matched.session) {
        try {
            //kemudian ambil session dan cokieJar 
            //note session = serialize, session disini adalah penamaan pada column database
            //deserialize sama deserializeCookieJar kurang paham intinya ketika sereliaze dan cokieJar mau digunakan untuk suatu fitur butuh di deserialize sama deserializeCookieJar
            await ig.state.deserialize(JSON.parse(matched.session?.session));
            await ig.state.deserializeCookieJar(JSON.parse(matched.session?.cookieJar));

            // menambahkan retry mesin untuk error handling
            const getFeedsWithRetry = async () => {
                try {
                    //mencari postingan berdasarkan locationId
                    await sleep(2000); // delay 2 seconds
                    const feeds = ig.feed.location(dataLocation.locationId);
                    //kalo ga salah ini buat check apakah dataHastags terdapat nextMaxId jika ada maka berikan nextMaxId yang berasal dari feeds 
                    if (dataLocation.nextMaxId) {
                        feeds['nextMaxId'] = dataLocation.nextMaxId;
                    }

                    return await feeds.request();
                } catch (error: any) {
                    //apabila terdapat error 
                    if (error instanceof IgCheckpointError) {
                        return { status: 500, error: 'Account anda terkena challenge' };
                    }
                    if (error.name === 'IgActionSpamError') {
                        return { status: 500, error: 'Account terkena spam' };
                    }
                    if (error.name === 'IgNetworkError') {
                        await sleep(5000); // wait longer for network error
                        const feeds = ig.feed.location(dataLocation.locationId);
                        if (dataLocation.nextMaxId) {
                            feeds['nextMaxId'] = dataLocation.nextMaxId;
                        }
                        return await feeds.request(); // retry once
                    }
                    return { error: error.error };
                }
            };

            const response = await getFeedsWithRetry();

            // Check if there was an error
            if ('error' in response) {
                return {
                    success: 500,
                    error: 'Terjadi kesalahan saat Scrapping, Pastikan internet anda dalam keadaan baik dan silahkan coba lagi'
                };
            }

            const sections = response.sections || [];
            const nextPageMaxId = response.next_max_id || null;
            //const posts gunanya untuk mengatur tata letak agar mudah di filter dan dipilih yang penting saja
            const posts = sections.flatMap((section) => {
                if (section.layout_content?.medias) {
                    return section.layout_content.medias.map(
                        (media) => media.media
                    );
                }
                return [];
            });
            //kemudian hasil dari post di atur agar sesuai menggunakan fungsi mapPosts
            const mappedFeeds = await mapPosts(posts);
            //kirim hasil dari mappedFeeds ke front end dan nextMaxId untuk fitur load more
            return {
                success: true,
                data: {
                    feeds: mappedFeeds,
                    nextMaxId: nextPageMaxId
                }
            };
        } catch (error) {
            return {
                success: 400,
                error: 'Search failed. Please try again'
            };
        }
    }
    return {
        success: 500,
        error: 'User session not found'
    };
};
//ini gak jadi di pakek fungsinya adalah retry mesin cuman bentuknya function
const getFeedsWithRetry = async (feedFn: () => Promise<any>, retryCount = 3) => {
    for (let i = 0; i < retryCount; i++) {
        try {
            await sleep(2000); // delay antar request
            return await feedFn();
        } catch (error: any) {
            if (i === retryCount - 1) throw error; // throw on last retry

            if (error.name === 'IgCheckpointError') {
                throw new Error('Account anda terkena challenge');
            }
            if (error.name === 'IgActionSpamError') {
                await sleep(10000); // tunggu lebih lama jika kena spam block
                continue;
            }
            if (error.name === 'IgNetworkError') {
                await sleep(5000);
                continue;
            }

            await sleep(3000); // delay sebelum retry
        }
    }
};

const instagramHandle = {
    invoke: [
        {
            name: "handleLogin",
            togo: handleLogin
        },
        {
            name: "getAllUsersInstagram",
            togo: getAllUsers
        },
        {
            name: "loginPrivate",
            togo: loginPrivate
        },
        {
            name: "logoutUsers",
            togo: logoutUsers
        },
        {
            name: "deleteUsersIg",
            togo: deleteUsers
        },
        {
            name: "search",
            togo: search
        },
        {
            name: "getFeedsByHastag",
            togo: getFeedsByHastag
        },
        {
            name: "getFeedsByUsername",
            togo: getFeedsByUsername
        },
        {
            name: "getFeedsByLocation",
            togo: getFeedsByLocation
        }
    ]
}

export { instagramHandle }
