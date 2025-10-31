HYGRAPH_COURSES_QUERY = """
  query UniversityCourses {
    courses {
      id
      slug
      title
      shortDescription
      longDescription {
        markdown
      }
      category
      level
      duration
      badgeLabel
      lessonsCount
      tags {
        hashtag
      }
      heroImage {
        url
      }
      courseOutcome {
        id
        outcome
      }
      courseModules(orderBy: order_ASC) {
        id
        title
        duration
        overview {
          markdown
        }
        slug
        order
        moduleItems {
          id
          title
          description
          content {
            markdown
          }
          video {
            fileName
            url
          }
        }
        assessment {
          assessmentQuestions {
            prompt {
              markdown
            }
            explanation {
              markdown
            }
            options {
              text
              isCorrect
            }
          }
        }
      }
      instructors {
        id
        name
        title
        slug
        speciality
        avatar {
          url
        }
      }
      practiceSet {
        id
        slug
        title
        description
        practiceQuestions {
          topic
          difficulty
          prompt {
            markdown
          }
          practiceAnswers {
            label
            isCorrect
            body {
              markdown
            }
          }
          correctAnswer {
            label
            isCorrect
            body {
              markdown
            }
          }
        }
      }
    }
  }
"""

HYGRAPH_PRACTICE_SETS_QUERY = """
  query UniversityPracticeSets {
    practiceSets {
      id
      slug
      title
      description
      tag
      questions
      accuracy
      trend
      estimatedTime
    }
  }
"""
