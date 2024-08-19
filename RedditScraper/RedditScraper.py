import requests
from RedditPost import RedditPost
from RedditSub import RedditSub
from RedditComment import RedditComment
from typing import List


class RedditScraper:
    """Class for scraping posts, comments, subreddits, etc. from Reddit"""

    def __init__(self, client_id, secret_key, username, password, user_agent):
        """
        Initialises an instance of the RedditScraper class with the necessary
        authentication details for accessing the Reddit API. This constructor sets up
        authentication parameters, retrieves an access token, and prepares the header
        with the access token for future API requests.

        Parameters:
        client_id: The client ID provided by Reddit for API access.
        secret_key: The secret key provided by Reddit that pairs with the client ID.
        username: The Reddit account username used for authentication.
        password: The password corresponding to the Reddit account.
        user_agent: A string identifying the application making the request, typically
                    formatted as 'appname/version'.
        """
        # Creates an authentication object, which is used to securely pass user
        # credentials to API services
        self.auth = requests.auth.HTTPBasicAuth(client_id, secret_key)

        # Info needed to login to the Reddit API
        self.data = {
            "grant_type": "password",
            "username": username,
            "password": password,
        }

        # Name + version of application making the request
        self.headers = {"User-Agent": user_agent}

        # Requests access token from Reddit API
        access_token = requests.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=self.auth,
            data=self.data,
            headers=self.headers,
        ).json()["access_token"]

        # Adds access token to header so that subsequent requests to the Reddit API
        # are made with the access token included
        self.headers["Authorization"] = f"bearer {access_token}"

    def get_posts_from_subreddit(
        self, sort: str, subreddit: str, time: str = "", limit: int = 10
    ) -> list[RedditPost]:
        """Returns a list of posts from a specified subreddit

        Parameters:
            sort: What to sort the posts by (can be one of "top", "new",
                  "rising", "hot", or "controversial")
            subreddit: Name of subreddit to get posts from
            time: Timeframe of posts (can be one of "hour", "day", "week", "month,
                  "year", or "all") (ONLY REQUIRED IF sort in ["top", "controversial"])
            limit: Number of posts to return

        Returns:
            A list of RedditPosts

        Raises:
            ValueError: Propogates the ValueError raised by RedditScraper.validate_params()
        """
        RedditScraper.validate_params(
            sort=[sort, "posts_in_subreddit"], limit=limit, subreddit=subreddit
        )

        if sort == "top" or sort == "controversial":
            RedditScraper.validate_params(time=time)
            res = requests.get(
                f"https://oauth.reddit.com/r/{subreddit}/{sort}.json?limit={limit}&t={time}",
                headers=self.headers,
            ).json()
        else:
            res = requests.get(
                f"https://oauth.reddit.com/r/{subreddit}/{sort}.json?limit={limit}",
                headers=self.headers,
            ).json()

        posts = []

        for post in res["data"]["children"]:
            post = post["data"]
            posts.append(
                RedditPost(
                    title=post["title"],
                    content=post["selftext"],
                    subreddit=post["subreddit_name_prefixed"],
                    score=post["ups"],
                    comment_count=post["num_comments"],
                    id=post["id"],
                    url=post["url"],
                )
            )

        return posts

    def search_keyword_in_subreddit(
        self, sort: str, subreddit: str, keyword: str, time: str = "", limit: int = 10
    ) -> List[RedditPost]:
        """Returns posts most relevant to a keyword in a specific subreddit

        Parameters:
            sort: What to sort the posts by (can be one of "relevance", "hot", "top",
                  "new", or "comments")
            subreddit: Name of subreddit to search keyword in
            keyword: Keyword to search posts by
            time: Timeframe of posts (can be one of "hour", "day", "week", "month,
                  "year", or "all") (ONLY REQUIRED IF sort in ["relevance", "top",
                  "comments"])
            limit: Number of posts to return

        Returns:
            A list of RedditPosts

        Raises:
            ValueError: Propogates the ValueError raised by RedditScraper.validate_params()
        """
        RedditScraper.validate_params(
            limit=limit,
            subreddit=subreddit,
            keyword=keyword,
            sort=[sort, "keywords_in_subreddit"],
        )

        keyword = "+".join(keyword.strip().split(" "))

        if sort in ["relevance", "top", "comments"]:
            RedditScraper.validate_params(time=time)
            res = requests.get(
                f"https://oauth.reddit.com/r/{subreddit}/search?q={keyword}&limit={limit}&restrict_sr=on&sort={sort}&t={time}",
                headers=self.headers,
            ).json()
        else:
            res = requests.get(
                f"https://oauth.reddit.com/r/{subreddit}/search?q={keyword}&limit={limit}&restrict_sr=on&sort={sort}",
                headers=self.headers,
            ).json()

        posts = []

        for post in res["data"]["children"]:
            post = post["data"]
            posts.append(
                RedditPost(
                    title=post["title"],
                    content=post["selftext"],
                    subreddit=post["subreddit_name_prefixed"],
                    score=post["ups"],
                    comment_count=post["num_comments"],
                    id=post["id"],
                    url=post["url"],
                )
            )

        return posts

    def search_keyword_in_reddit(
        self, sort: str, keyword: str, time: str = "", limit: int = 10
    ) -> List[RedditPost]:
        """Returns posts most relevant to a keyword in all of Reddit

        Parameters:
            sort: What to sort the posts by (can be one of "relevance", "hot", "top",
                  "new", or "comments")
            keyword: Keyword to search posts by
            time: Timeframe of posts (can be one of "hour", "day", "week", "month,
                  "year", or "all") (ONLY REQUIRED IF sort in ["relevance", "top",
                  "comments"])
            limit: Number of posts to return

        Returns:
            A list of RedditPosts

        Raises:
            ValueError: Propogates the ValueError raised by RedditScraper.validate_params()
        """
        RedditScraper.validate_params(
            keyword=keyword, limit=limit, sort=[sort, "keywords_in_reddit"]
        )

        keyword = "+".join(keyword.strip().split(" "))

        if sort in ["relevance", "top", "comments"]:
            RedditScraper.validate_params(time=time)
            res = requests.get(
                f"https://oauth.reddit.com/search.json?q={keyword}&limit={limit}&t={time}&sort={sort}",
                headers=self.headers,
            ).json()
        else:
            res = requests.get(
                f"https://oauth.reddit.com/search.json?q={keyword}&limit={limit}&sort={sort}",
                headers=self.headers,
            ).json()

        posts = []

        for post in res["data"]["children"]:
            post = post["data"]
            posts.append(
                RedditPost(
                    title=post["title"],
                    content=post["selftext"],
                    subreddit=post["subreddit_name_prefixed"],
                    score=post["ups"],
                    comment_count=post["num_comments"],
                    id=post["id"],
                    url=post["url"],
                )
            )

        return posts

    def search_for_subreddits(self, keyword: str, limit: int = 5) -> List[RedditSub]:
        """Returns subreddits most relevant to a keyword in all of Reddit

        Parameters:
            keyword: Keyword to find subreddits related to
            limit: Number of posts to return

        Returns:
            A list of RedditSubs

        Raises:
            ValueError: Propogates the ValueError raised by RedditScraper.validate_params()
        """
        RedditScraper.validate_params(limit=limit, keyword=keyword)

        keyword = "+".join(keyword.strip().split(" "))

        res = requests.get(
            f"https://oauth.reddit.com/search.json?q={keyword}&type=sr&limit={limit}",
            headers=self.headers,
        ).json()

        subreddits = []

        for subreddit in res["data"]["children"]:
            subreddit = subreddit["data"]
            subreddits.append(
                RedditSub(
                    name=subreddit["display_name_prefixed"],
                    description=subreddit["public_description"],
                    subscribers=subreddit["subscribers"],
                    url=subreddit["url"],
                )
            )

        return subreddits

    def get_comments_from_post(
        self, sort, subreddit, depth, post_id, limit
    ) -> List[RedditComment]:
        """Returns subreddits most relevant to a keyword in all of Reddit

        Parameters:
            sort: What to sort the comments by (can be one of "confidence" (best),
                 "top", "new", "controversial", or "old")
            subreddit: Name of the subreddit that the post was created in
            depth: Maximum depth of subtrees in the thread
            post_id: Unique ID Reddit assigns to every post
            limit: Number of comments to return

        Returns:
            A list of RedditComments

        Raises:
            ValueError: Propogates the ValueError raised by RedditScraper.validate_params()
        """
        RedditScraper.validate_params(
            limit=limit,
            post_id=post_id,
            depth=depth,
            subreddit=subreddit,
            sort=[sort, "comments_in_post"],
        )

        res = requests.get(
            f"https://oauth.reddit.com/r/{subreddit}/comments/{post_id}?limit={limit}&sort={sort}&depth={depth}",
            headers=self.headers,
        ).json()

        comments = []
        length = len(res[1]["data"]["children"]) - 1

        for i in range(length):
            temp_comment = res[1]["data"]["children"][i]["data"]
            comments.append(RedditComment(temp_comment["body"], temp_comment["ups"]))

        return comments

    def validate_params(
        limit: int = None,
        subreddit: str = None,
        time: str = None,
        keyword: str = None,
        sort: List[str] = None,
        depth: int = None,
        post_id: str = None,
    ):
        """
        Validates the parameters for fetching data from Reddit based on provided limits
        and sorting preferences.

        Parameters:
        limit: The maximum number of items to return. Must be greater than 0.
               subreddit: The subreddit to fetch posts from. Cannot be an empty string.
        time: The timeframe to fetch posts. Must be one of "hour", "day", "week",
              "month", "year", or "all".
        keyword: The keyword to filter posts. Cannot be an empty string.
        sort: A list containing two elements where the first element is the sorting
              criterion and the second is the context ("posts_in_subreddit",
              "keywords_in_subreddit", "keywords_in_reddit", "comments_in_post") for
              the sorting criterion. The sort criteria must be compatible with the
              specified context.
        depth: The depth of comment threads to fetch. Must be greater than 0.
        post_id: The ID of a specific post to fetch comments from. Cannot be an empty
                 string.

        Raises:
        ValueError: If any of the parameters are not within their required constraints.

        Note:
        This function does not return any value; it only raises exceptions if any
        parameter validations fail.
        """
        allowed_sorts = {
            "posts_in_subreddit": ["top", "new", "rising", "hot", "controversial"],
            "keywords_in_subreddit": ["relevance", "hot", "top", "new", "comments"],
            "keywords_in_reddit": ["relevance", "hot", "top", "new", "comments"],
            "comments_in_post": ["confidence", "top", "new", "controversial", "old"],
        }
        allowed_timeframes = ["hour", "day", "week", "month", "year", "all"]

        if limit and limit < 1:
            raise ValueError("Limit cannot be <= 0")
        if subreddit and subreddit == "":
            raise ValueError("Subreddit cannot be empty string")
        if keyword and keyword == "":
            raise ValueError("Keyword cannot be empty")
        if depth and depth <= 0:
            raise ValueError("Depth cannot be <= 0")
        if post_id and post_id == "":
            raise ValueError("Post ID cannot be empty")
        if time and time not in allowed_timeframes:
            raise ValueError("Timeframe is invalid")

        if sort:
            if len(sort) != 2:
                raise ValueError("Invalid sort")
            else:
                if sort[0] not in allowed_sorts[sort[1]]:
                    raise ValueError("Invalid sort")


redditScraper = RedditScraper(
    "DgXAnMfXLGnryIPt4wbVXw",
    "Ajgvgvb7oJ4YlGYf68xcyl2lkl8xiA",
    "Spiritual_Echo_3761",
    "BrieflyAI2024/",
    "ExperimentAPI/0.0.1",
)
