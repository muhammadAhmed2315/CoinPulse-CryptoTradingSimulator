class RedditPost:
    """Class for storing information about a Reddit post"""

    def __init__(
        self,
        title: str,
        content: str,
        subreddit: str,
        score: int,
        comment_count: int,
        id: str,
        url: str,
    ):
        """
        Intialises the RedditPost object with the required data

        Parameters:
        title: Post title
        content: Actual body content of the post
        subreddit: Name of the subreddit the post was made in
        score: Net number of upvotes minus number of downvotes
        comment_count: Number of comments under the post
        id: Unique id Reddit associates with the post
        url: Reddit URL for the post
        """
        self.title = title
        self.content = content
        self.subreddit = subreddit
        self.score = score
        self.comment_count = comment_count
        self.id = id
        self.url = url
