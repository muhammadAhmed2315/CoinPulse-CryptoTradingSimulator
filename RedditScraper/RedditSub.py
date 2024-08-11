class RedditSub:
    """Class for storing information about a Subreddit"""

    def __init__(self, name: str, description: str, subscribers: str, url: str):
        """
        Intialises the RedditSub object with the required data

        Parameters:
        name: Name of the subreddit
        description: Description/slogan associated with the subreddit
        Subcribers: Number of members/subscribers to the subreddit
        url: URL of the subreddit
        """
        self.name = name
        self.description = description
        self.subscribers = subscribers
        self.url = "https://reddit.com/" + url
