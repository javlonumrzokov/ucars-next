import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      _id
      name
      email
      role
      avatar
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        _id
        name
        email
        role
        avatar
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      accessToken
      user {
        _id
        name
        email
        role
        avatar
      }
    }
  }
`;

const VEHICLE_FIELDS = gql`
  fragment VehicleFields on VehicleEntity {
    _id
    vehicleCategory
    vehicleStatus
    vehicleType
    vehicleBrand
    vehicleGearbox
    vehicleFuel
    vehicleModel
    vehicleAddress
    vehiclePrice
    vehicleMileage
    vehicleMadeYear
    vehicleViews
    vehicleLikes
    vehicleImages
    vehicleDesc
    memberId
    createdAt
  }
`;

export const VEHICLES_QUERY = gql`
  ${VEHICLE_FIELDS}
  query Vehicles($inquiry: VehiclesInquiry!) {
    vehicles(inquiry: $inquiry) {
      items {
        ...VehicleFields
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const SMART_SEARCH_QUERY = gql`
  ${VEHICLE_FIELDS}
  query SmartSearch($query: String!, $page: Int, $limit: Int) {
    smartSearch(query: $query, page: $page, limit: $limit) {
      items {
        ...VehicleFields
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const VEHICLE_QUERY = gql`
  ${VEHICLE_FIELDS}
  query Vehicle($id: ID!) {
    vehicle(id: $id) {
      ...VehicleFields
    }
  }
`;

export const VEHICLES_BY_IDS_QUERY = gql`
  ${VEHICLE_FIELDS}
  query VehiclesByIds($ids: [ID!]!) {
    vehiclesByIds(ids: $ids) {
      ...VehicleFields
    }
  }
`;

export const LIKE_MUTATION = gql`
  mutation Like($targetType: TargetType!, $targetId: ID!) {
    like(targetType: $targetType, targetId: $targetId) {
      _id
    }
  }
`;

export const UNLIKE_MUTATION = gql`
  mutation Unlike($targetType: TargetType!, $targetId: ID!) {
    unlike(targetType: $targetType, targetId: $targetId)
  }
`;

export const HAS_LIKED_QUERY = gql`
  query HasLiked($targetType: TargetType!, $targetId: ID!) {
    hasLiked(targetType: $targetType, targetId: $targetId)
  }
`;

const ARTICLE_FIELDS = gql`
  fragment ArticleFields on ArticleEntity {
    _id
    title
    content
    coverImage
    tags
    author
    likeCount
    viewCount
    createdAt
    updatedAt
  }
`;

export const ARTICLES_QUERY = gql`
  ${ARTICLE_FIELDS}
  query Articles($page: Int, $limit: Int, $search: String, $tag: String) {
    articles(page: $page, limit: $limit, search: $search, tag: $tag) {
      items {
        ...ArticleFields
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const ARTICLE_QUERY = gql`
  ${ARTICLE_FIELDS}
  query Article($id: ID!) {
    article(id: $id) {
      ...ArticleFields
    }
  }
`;

export const MY_ARTICLES_QUERY = gql`
  ${ARTICLE_FIELDS}
  query MyArticles {
    myArticles {
      ...ArticleFields
    }
  }
`;

export const ARTICLES_BY_IDS_QUERY = gql`
  ${ARTICLE_FIELDS}
  query ArticlesByIds($ids: [ID!]!) {
    articlesByIds(ids: $ids) {
      ...ArticleFields
    }
  }
`;

export const CREATE_ARTICLE_MUTATION = gql`
  ${ARTICLE_FIELDS}
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      ...ArticleFields
    }
  }
`;

export const MY_VEHICLES_QUERY = gql`
  ${VEHICLE_FIELDS}
  query MyVehicles {
    myVehicles {
      ...VehicleFields
    }
  }
`;

export const CREATE_VEHICLE_MUTATION = gql`
  ${VEHICLE_FIELDS}
  mutation CreateVehicle($input: CreateVehicleInput!) {
    createVehicle(input: $input) {
      ...VehicleFields
    }
  }
`;

export const FOLLOW_MUTATION = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      _id
    }
  }
`;

export const UNFOLLOW_MUTATION = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId)
  }
`;

export const IS_FOLLOWING_QUERY = gql`
  query IsFollowing($userId: ID!) {
    isFollowing(userId: $userId)
  }
`;

export const MY_FOLLOWERS_QUERY = gql`
  query MyFollowers {
    myFollowers {
      _id
      user { _id name email role avatar }
      createdAt
    }
  }
`;

export const MY_FOLLOWING_QUERY = gql`
  query MyFollowing {
    myFollowing {
      _id
      user { _id name email role avatar }
      createdAt
    }
  }
`;

export const FOLLOWERS_COUNT_QUERY = gql`
  query FollowersCount($userId: ID!) {
    followersCount(userId: $userId)
  }
`;

export const FOLLOWING_COUNT_QUERY = gql`
  query FollowingCount($userId: ID!) {
    followingCount(userId: $userId)
  }
`;

export const MY_LIKED_VEHICLES_QUERY = gql`
  ${VEHICLE_FIELDS}
  query MyLikedVehicles {
    myLikedVehicles {
      ...VehicleFields
    }
  }
`;

export const MY_LIKED_ARTICLES_QUERY = gql`
  ${ARTICLE_FIELDS}
  query MyLikedArticles {
    myLikedArticles {
      ...ArticleFields
    }
  }
`;

export const MY_RECENT_VIEWS_QUERY = gql`
  query MyRecentViews {
    myRecentViews {
      _id
      targetType
      targetId
      createdAt
    }
  }
`;

export const COMMENTS_QUERY = gql`
  query Comments($targetType: TargetType!, $targetId: ID!, $page: Int, $limit: Int) {
    comments(targetType: $targetType, targetId: $targetId, page: $page, limit: $limit) {
      items {
        _id
        author { _id name }
        content
        parent
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      _id
      author { _id name }
      content
      parent
      createdAt
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const MY_NOTIFICATIONS_QUERY = gql`
  query MyNotifications($page: Int, $limit: Int, $unreadOnly: Boolean) {
    myNotifications(page: $page, limit: $limit, unreadOnly: $unreadOnly) {
      items {
        _id
        actor { _id name }
        type
        targetType
        targetId
        message
        read
        createdAt
      }
      total
      totalPages
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT_QUERY = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      _id
      read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const MY_CHAT_ROOMS_QUERY = gql`
  query MyChatRooms {
    myChatRooms {
      _id
      type
      name
      participants { _id name }
      lastMessageAt
      createdAt
    }
  }
`;

export const MESSAGES_QUERY = gql`
  query Messages($roomId: ID!, $page: Int, $limit: Int) {
    messages(roomId: $roomId, page: $page, limit: $limit) {
      items {
        _id
        room
        sender { _id name }
        content
        readBy
        createdAt
      }
      total
      totalPages
    }
  }
`;

export const OPEN_COMMUNITY_CHAT_MUTATION = gql`
  mutation OpenCommunityChat {
    openCommunityChat {
      _id
      type
      name
      participants { _id name }
      lastMessageAt
    }
  }
`;

export const OPEN_PRIVATE_CHAT_MUTATION = gql`
  mutation OpenPrivateChat($userId: ID!) {
    openPrivateChat(userId: $userId) {
      _id
      type
      name
      participants { _id name }
      lastMessageAt
    }
  }
`;

export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      _id
      room
      sender { _id name }
      content
      readBy
      createdAt
    }
  }
`;

// ─── Admin ────────────────────────────────────────────────────────────────────

export const ADMIN_USERS_QUERY = gql`
  query AdminUsers($page: Int, $limit: Int, $search: String, $role: UserRole) {
    adminUsers(page: $page, limit: $limit, search: $search, role: $role) {
      items {
        _id
        name
        email
        role
        createdAt
      }
      total
      page
      totalPages
    }
  }
`;

export const ADMIN_UPDATE_USER_ROLE_MUTATION = gql`
  mutation AdminUpdateUserRole($id: ID!, $role: UserRole!) {
    adminUpdateUserRole(id: $id, role: $role) {
      _id
      role
    }
  }
`;

export const ADMIN_DELETE_USER_MUTATION = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id)
  }
`;

export const ADMIN_VEHICLES_QUERY = gql`
  query AdminVehicles($page: Int, $limit: Int, $search: String, $status: String) {
    adminVehicles(page: $page, limit: $limit, search: $search, status: $status) {
      items {
        _id
        vehicleBrand
        vehicleModel
        vehicleStatus
        vehiclePrice
        vehicleViews
        vehicleLikes
        memberId
        createdAt
      }
      total
      page
      totalPages
    }
  }
`;

export const ADMIN_CHANGE_VEHICLE_STATUS_MUTATION = gql`
  mutation AdminChangeVehicleStatus($id: ID!, $status: VehicleStatus!) {
    adminChangeVehicleStatus(id: $id, status: $status) {
      _id
      vehicleStatus
    }
  }
`;

export const ADMIN_DELETE_VEHICLE_MUTATION = gql`
  mutation AdminDeleteVehicle($id: ID!) {
    adminDeleteVehicle(id: $id)
  }
`;

export const ADMIN_ARTICLES_QUERY = gql`
  query AdminArticles($page: Int, $limit: Int, $search: String) {
    adminArticles(page: $page, limit: $limit, search: $search) {
      items {
        _id
        title
        author
        likeCount
        viewCount
        createdAt
      }
      total
      page
      totalPages
    }
  }
`;

export const ADMIN_DELETE_ARTICLE_MUTATION = gql`
  mutation AdminDeleteArticle($id: ID!) {
    adminDeleteArticle(id: $id)
  }
`;
