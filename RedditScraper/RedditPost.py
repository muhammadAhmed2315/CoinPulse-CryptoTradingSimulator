class RedditPost:
    """Class for storing information about a Reddit post"""

    def __init__(
        self,
        title: str,
        thumbnail: str,
        content: str,
        subreddit: str,
        score: int,
        comment_count: int,
        id: str,
        url: str,
        fullname: str,
        timestamp: int,
    ):
        """
        Intialises the RedditPost object

        Parameters:
        title: Post title
        thumbnail: Thumbnail image if the video contains an image/video/gif
        content: Actual body content of the post
        subreddit: Name of the subreddit the post was made in
        score: Net number of upvotes minus number of downvotes
        comment_count: Number of comments under the post
        id: Unique id Reddit associates with the post
        url: Reddit URL for the post
        fullname: The full name of the post, which is used by Reddit's API for
                  pagination
        """
        self.title = title
        self.thumbnail = thumbnail
        self.content = content
        self.subreddit = subreddit
        self.score = score
        self.comment_count = comment_count
        self.id = id
        self.url = url
        self.fullname = fullname
        self.timestamp = timestamp
